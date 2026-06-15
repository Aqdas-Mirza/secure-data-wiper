import { Router } from 'express';
import * as si from 'systeminformation';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const router = Router();

interface DriveInfo {
  device: string;
  label: string;
  type: 'HDD' | 'SSD' | 'USB' | 'Network';
  size: number;
  used: number;
  available: number;
  filesystem: string;
  mountpoint: string;
  isRemovable: boolean;
}

interface SystemInfo {
  platform: string;
  arch: string;
  hostname: string;
  user: string;
  drives: DriveInfo[];
  permissions: {
    isAdmin: boolean;
    canAccessSystemFiles: boolean;
  };
}

// Get system information and detected drives
router.get('/scan', async (req, res) => {
  try {
    console.log('🔍 Starting system scan...');
    
    const [diskLayout, blockDevices, fsSize] = await Promise.all([
      si.diskLayout(),
      si.blockDevices(),
      si.fsSize()
    ]);

    // Map drives with enhanced information
    const drives: DriveInfo[] = fsSize
      .filter(fs => fs.fs && fs.size > 0) // Filter valid drives
      .map(fs => {
        // Find corresponding disk info
        const diskInfo = diskLayout.find(disk => 
          fs.fs.toLowerCase().includes(disk.device.toLowerCase())
        );
        
        const blockInfo = blockDevices.find(block => 
          fs.fs.toLowerCase().includes(block.name.toLowerCase())
        );

        return {
          device: fs.fs,
          label: `Drive (${fs.fs})`,
          type: determineDriveType(diskInfo, blockInfo, fs),
          size: fs.size,
          used: fs.used,
          available: fs.available,
          filesystem: fs.type,
          mountpoint: fs.mount,
          isRemovable: blockInfo?.removable || false
        };
      });

    // Check admin permissions (Windows-specific for now)
    const permissions = await checkPermissions();

    // Build legacy devices array (for other consumers) and frontend-aligned data object
    const devices = drives.map(drive => ({
      device: drive.device,
      mountpoint: drive.mountpoint,
      filesystem: drive.filesystem,
      type: drive.type
    }));

    console.log(`✅ System scan complete. Found ${devices.length} devices`);

    // Permissions for frontend shape
    const adminPerms = await checkPermissions();

    // Wrap in { success, data } to match frontend App.tsx expectation
    res.json({
      success: true,
      data: {
        platform: process.platform,
        arch: process.arch,
        hostname: os.hostname(),
        user: os.userInfo().username,
        drives,
        // Include both shapes for compatibility
        permissions: {
          isAdmin: adminPerms.isAdmin,
          canAccessSystemFiles: adminPerms.canAccessSystemFiles,
          read: true,
          write: true,
          delete: true
        },
        // Also return legacy field if some UI parts still read it
        devices
      }
    });

  } catch (error) {
    console.error('❌ System scan failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scan system',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get detailed information about a specific drive
router.get('/drive/:device', async (req, res) => {
  try {
    const devicePath = decodeURIComponent(req.params.device);
    console.log(`🔍 Getting detailed info for drive: ${devicePath}`);

    const fsInfo = await si.fsSize();
    const drive = fsInfo.find(fs => fs.fs === devicePath);

    if (!drive) {
      return res.status(404).json({
        success: false,
        error: 'Drive not found'
      });
    }

    // Get additional drive statistics and return in expected format
    const driveInfo = {
      device: drive.fs,
      type: determineDriveType(null, null, drive),
      filesystem: drive.type,
      size: drive.size,
      mountpoint: drive.mount,
      model: "Unknown", // These fields aren't available from fsSize
      serial: "Unknown",
      vendor: "Unknown"
    };

    res.json(driveInfo);

  } catch (error) {
    console.error('❌ Drive info failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get drive information',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test file access permissions
router.post('/test-permissions', async (req, res) => {
  try {
    const { path: testPath } = req.body;
    
    if (!testPath) {
      return res.status(400).json({
        success: false,
        error: 'Path is required'
      });
    }

    const testResults = {
      read: false,
      write: false,
      delete: false
    };

    try {
      // Check if path exists and test permissions
      if (await fs.pathExists(testPath)) {
        // Test read access
        try {
          await fs.access(testPath, fs.constants.R_OK);
          testResults.read = true;
        } catch {}

        // Test write access
        try {
          await fs.access(testPath, fs.constants.W_OK);
          testResults.write = true;
          testResults.delete = true; // If we can write, we can delete
        } catch {}
      }

    } catch (error) {
      console.error('Permission test error:', error);
    }

    res.json({
      success: true,
      data: testResults
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Permission test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions
function determineDriveType(diskInfo: any, blockInfo: any, fsInfo: any): DriveInfo['type'] {
  // Check if removable first
  if (blockInfo?.removable || fsInfo.fs.includes('USB')) {
    return 'USB';
  }
  
  // Check network drives
  if (fsInfo.fs.startsWith('\\\\') || fsInfo.type === 'CIFS' || fsInfo.type === 'NFS') {
    return 'Network';
  }

  // Determine SSD vs HDD based on disk info
  if (diskInfo) {
    const name = diskInfo.name?.toLowerCase() || '';
    const vendor = diskInfo.vendor?.toLowerCase() || '';
    
    if (name.includes('ssd') || vendor.includes('ssd') || 
        name.includes('nvme') || diskInfo.type === 'SSD') {
      return 'SSD';
    }
  }

  return 'HDD'; // Default to HDD
}

async function checkPermissions() {
  const isWindows = os.platform() === 'win32';
  
  if (isWindows) {
    // Windows-specific permission checks
    try {
      // Try to access system directory
      await fs.access('C:\\Windows\\System32', fs.constants.R_OK);
      
      // Check if running as administrator (simplified check)
      const canAccessSystemFiles = await fs.access('C:\\Windows\\System32\\drivers\\etc\\hosts', fs.constants.W_OK)
        .then(() => true)
        .catch(() => false);

      return {
        isAdmin: canAccessSystemFiles,
        canAccessSystemFiles
      };
    } catch {
      return {
        isAdmin: false,
        canAccessSystemFiles: false
      };
    }
  }

  // For other platforms (future implementation)
  return {
    isAdmin: process.getuid ? process.getuid() === 0 : false,
    canAccessSystemFiles: true
  };
}

export default router;