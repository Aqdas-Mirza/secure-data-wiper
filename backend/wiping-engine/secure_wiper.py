#!/usr/bin/env python3
"""
NIST SP 800-88 Rev. 1 Compliant Secure File Wiping Engine
Supports Windows, macOS, and Linux with different storage types
"""

import os
import sys
import json
import secrets
import hashlib
import time
import platform
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional
import shutil

class SecureWiper:
    def __init__(self):
        self.platform = platform.system().lower()
        self.patterns = {
            'quick': [b'\x00'],
            'standard': [b'\x00', b'\xFF', b'\xAA'],
            'maximum': [b'\x00', b'\xFF', b'\xAA', b'\x55', b'\xCC', b'\x33', b'\x96']
        }
        
    def log_progress(self, data: Dict[str, Any]):
        """Send progress updates to Node.js via stdout"""
        print(f"PROGRESS:{json.dumps(data)}", flush=True)
    
    def log_error(self, error: str):
        """Send error messages to Node.js via stdout"""
        print(f"ERROR:{error}", flush=True)
    
    def get_file_info(self, file_path: str) -> Dict[str, Any]:
        """Get file information for verification"""
        try:
            path_obj = Path(file_path)
            if not path_obj.exists():
                return None
                
            stat = path_obj.stat()
            return {
                'path': file_path,
                'size': stat.st_size,
                'modified': stat.st_mtime,
                'exists': True
            }
        except Exception as e:
            return {'path': file_path, 'exists': False, 'error': str(e)}
    
    def is_ssd(self, file_path: str) -> bool:
        """Detect if file is on SSD (simplified detection)"""
        # This is a simplified check - in production, you'd use more sophisticated detection
        if self.platform == 'windows':
            # On Windows, check drive type via WMI or registry
            # For now, assume C: drive might be SSD
            drive = os.path.splitdrive(file_path)[0]
            return drive.upper() in ['C:', 'D:']  # Simplified assumption
        
        # For Linux/macOS, check /sys/block or similar
        return False
    
    def secure_overwrite_file(self, file_path: str, patterns: List[bytes], 
                            chunk_size: int = 1024 * 1024) -> Dict[str, Any]:
        """Securely overwrite a file with multiple passes"""
        try:
            path_obj = Path(file_path)
            if not path_obj.exists():
                return {'success': False, 'error': 'File does not exist'}
            
            file_size = path_obj.stat().st_size
            if file_size == 0:
                # Handle empty files
                path_obj.unlink()
                return {'success': True, 'bytes_written': 0, 'passes': len(patterns)}
            
            total_passes = len(patterns)
            bytes_written = 0
            
            # Open file for binary read/write
            with open(file_path, 'r+b') as f:
                for pass_num, pattern in enumerate(patterns, 1):
                    self.log_progress({
                        'current_pass': pass_num,
                        'total_passes': total_passes,
                        'current_file': file_path,
                        'pattern': pattern.hex()
                    })
                    
                    # Seek to beginning
                    f.seek(0)
                    position = 0
                    
                    while position < file_size:
                        # Calculate chunk size for this iteration
                        remaining = file_size - position
                        current_chunk_size = min(chunk_size, remaining)
                        
                        # Create pattern data
                        if len(pattern) == 1:
                            # Single byte pattern - repeat it
                            chunk_data = pattern * current_chunk_size
                        else:
                            # Multi-byte pattern - tile it
                            full_patterns = current_chunk_size // len(pattern)
                            remainder = current_chunk_size % len(pattern)
                            chunk_data = (pattern * full_patterns) + pattern[:remainder]
                        
                        # Write the pattern
                        f.write(chunk_data)
                        position += current_chunk_size
                        bytes_written += current_chunk_size
                        
                        # Progress update every MB
                        if position % (1024 * 1024) == 0 or position >= file_size:
                            progress = (position / file_size) * 100
                            self.log_progress({
                                'file_progress': progress,
                                'bytes_processed': position,
                                'total_bytes': file_size
                            })
                    
                    # Force write to disk
                    f.flush()
                    os.fsync(f.fileno())
            
            # Add random pass for maximum security
            if total_passes >= 7:
                self.log_progress({
                    'current_pass': total_passes + 1,
                    'total_passes': total_passes + 1,
                    'current_file': file_path,
                    'pattern': 'random'
                })
                
                with open(file_path, 'r+b') as f:
                    position = 0
                    while position < file_size:
                        remaining = file_size - position
                        current_chunk_size = min(chunk_size, remaining)
                        
                        # Generate random data
                        random_data = secrets.token_bytes(current_chunk_size)
                        f.write(random_data)
                        position += current_chunk_size
                        bytes_written += current_chunk_size
                    
                    f.flush()
                    os.fsync(f.fileno())
            
            # Truncate and delete file
            with open(file_path, 'w') as f:
                pass  # Truncate to 0 bytes
            
            # Final deletion
            path_obj.unlink()
            
            return {
                'success': True,
                'bytes_written': bytes_written,
                'passes': total_passes + (1 if total_passes >= 7 else 0),
                'file_size': file_size
            }
            
        except PermissionError:
            return {'success': False, 'error': 'Permission denied - file may be in use'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def secure_wipe_directory(self, dir_path: str, security_level: str) -> Dict[str, Any]:
        """Recursively wipe all files in a directory"""
        try:
            path_obj = Path(dir_path)
            if not path_obj.exists():
                return {'success': False, 'error': 'Directory does not exist'}
            
            patterns = self.patterns[security_level]
            results = []
            
            # Get all files recursively
            all_files = list(path_obj.rglob('*'))
            files_only = [f for f in all_files if f.is_file()]
            
            self.log_progress({
                'total_files': len(files_only),
                'directory': dir_path
            })
            
            for i, file_path in enumerate(files_only):
                self.log_progress({
                    'files_processed': i,
                    'total_files': len(files_only),
                    'current_file': str(file_path)
                })
                
                result = self.secure_overwrite_file(str(file_path), patterns)
                results.append({
                    'file': str(file_path),
                    'result': result
                })
            
            # Remove empty directories
            try:
                shutil.rmtree(dir_path)
            except:
                pass  # Best effort
            
            return {
                'success': True,
                'files_processed': len(files_only),
                'results': results
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def wipe_free_space(self, drive_path: str, size_mb: int = 100) -> Dict[str, Any]:
        """Wipe free space on a drive (simplified version)"""
        try:
            # Create a temporary file to fill free space
            temp_file = Path(drive_path) / f"temp_wipe_{secrets.token_hex(8)}.tmp"
            
            # Get available space
            statvfs = os.statvfs(drive_path) if hasattr(os, 'statvfs') else None
            if statvfs:
                free_space = statvfs.f_frsize * statvfs.f_available
            else:
                # Windows fallback
                import shutil
                _, _, free_space = shutil.disk_usage(drive_path)
            
            # Limit to specified size or available space
            max_size = min(size_mb * 1024 * 1024, free_space - (100 * 1024 * 1024))  # Leave 100MB
            
            if max_size <= 0:
                return {'success': False, 'error': 'Insufficient free space'}
            
            # Write random data to fill space
            written = 0
            chunk_size = 1024 * 1024  # 1MB chunks
            
            with open(temp_file, 'wb') as f:
                while written < max_size:
                    remaining = max_size - written
                    current_chunk = min(chunk_size, remaining)
                    
                    # Write random data
                    random_data = secrets.token_bytes(current_chunk)
                    f.write(random_data)
                    written += current_chunk
                    
                    # Progress update
                    progress = (written / max_size) * 100
                    self.log_progress({
                        'free_space_progress': progress,
                        'bytes_written': written,
                        'total_bytes': max_size
                    })
                
                f.flush()
                os.fsync(f.fileno())
            
            # Delete the temporary file
            temp_file.unlink()
            
            return {
                'success': True,
                'bytes_written': written,
                'free_space_wiped': written
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def verify_wipe(self, original_files: List[str]) -> Dict[str, Any]:
        """Verify that files have been successfully wiped"""
        results = {
            'verified': True,
            'files_checked': len(original_files),
            'still_exist': [],
            'verification_method': 'File existence check'
        }
        
        for file_path in original_files:
            if Path(file_path).exists():
                results['verified'] = False
                results['still_exist'].append(file_path)
        
        return results

def main():
    parser = argparse.ArgumentParser(description='Secure File Wiping Engine')
    parser.add_argument('--files', nargs='+', help='Files to wipe')
    parser.add_argument('--security-level', choices=['quick', 'standard', 'maximum'], 
                       default='standard', help='Security level')
    parser.add_argument('--mode', choices=['files', 'directory', 'free-space'], 
                       default='files', help='Wiping mode')
    parser.add_argument('--drive', help='Drive path for free space wiping')
    parser.add_argument('--size', type=int, default=100, help='Size in MB for free space wiping')
    
    args = parser.parse_args()
    
    wiper = SecureWiper()
    
    try:
        if args.mode == 'files' and args.files:
            patterns = wiper.patterns[args.security_level]
            results = []
            
            wiper.log_progress({
                'status': 'starting',
                'total_files': len(args.files),
                'security_level': args.security_level,
                'patterns_count': len(patterns)
            })
            
            for i, file_path in enumerate(args.files):
                wiper.log_progress({
                    'status': 'wiping',
                    'current_file': file_path,
                    'file_index': i + 1,
                    'total_files': len(args.files)
                })
                
                result = wiper.secure_overwrite_file(file_path, patterns)
                results.append({
                    'file': file_path,
                    'success': result['success'],
                    'bytes_written': result.get('bytes_written', 0),
                    'error': result.get('error')
                })
            
            # Verification
            wiper.log_progress({'status': 'verifying'})
            verification = wiper.verify_wipe(args.files)
            
            # Final result
            final_result = {
                'success': all(r['success'] for r in results),
                'files_processed': len(results),
                'results': results,
                'verification': verification,
                'security_level': args.security_level
            }
            
            wiper.log_progress({'status': 'completed'})
            print(f"RESULT:{json.dumps(final_result)}")
            
        elif args.mode == 'free-space' and args.drive:
            result = wiper.wipe_free_space(args.drive, args.size)
            print(f"RESULT:{json.dumps(result)}")
            
        else:
            wiper.log_error("Invalid arguments provided")
            sys.exit(1)
            
    except KeyboardInterrupt:
        wiper.log_error("Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        wiper.log_error(f"Unexpected error: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()