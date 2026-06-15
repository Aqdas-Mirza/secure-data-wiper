# 🔒 Secure Data Wiper

## Project Description

A web-based secure data deletion application that permanently removes sensitive files from storage devices according to **NIST SP 800-88** standards. Unlike traditional file deletion which leaves data recoverable on disk, Secure Data Wiper physically overwrites deleted data with cryptographically secure patterns, making recovery impossible.

**Key Problem Solved**: Traditional file deletion only removes file system entries while data remains recoverable using forensic tools. This application provides verified, compliant data destruction with professional audit certificates.

---

## Features

✅ **Multi-Level Security Options**
- Quick Wipe (1-pass) - Temporary files
- Standard Wipe (3-pass NIST compliant) - Business data  
- Maximum Wipe (7-pass DoD compliant) - Classified data

✅ **Intelligent Device Detection**
- Automatically detects all connected storage devices
- Identifies storage type (HDD, SSD, USB)
- Displays filesystem and available space

✅ **Flexible File Selection**
- File browser with checkboxes
- Drag & drop interface
- Manual path entry
- Batch selection support

✅ **Real-Time Progress Monitoring**
- Live progress bar with percentage
- Current file display
- Pass number tracking
- Estimated time remaining
- Wiping speed display

✅ **Comprehensive Verification System**
- JSON reports (machine-readable)
- PDF certificates (human-readable)
- Digital signatures for integrity
- QR code verification

✅ **Professional Dashboard**
- System information overview
- Device health indicators
- Wipe history tracking
- Session management

✅ **Complete Audit Trail**
- All operations timestamped and logged
- Files, sizes, and security levels recorded
- Completion status and error tracking
- Exportable compliance records

✅ **Enterprise-Ready Features**
- Pause and resume capability
- Error handling and recovery
- Role-based access preparation
- Compliance reporting

---

## Technologies Used

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Responsive styling
- **Socket.io Client** - Real-time updates
- **Axios** - HTTP client
- **React Router** - Navigation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Socket.io** - WebSocket communication
- **Python 3.8+** - Wiping engine

### Wiping Engine
- **Python** - Core wiping logic
- **os module** - File operations
- **secrets module** - Cryptographic randomness
- **hashlib** - SHA-256 verification
- **subprocess** - Process management

### DevOps & Tools
- **npm/yarn** - Package management
- **Nodemon** - Development server
- **ts-node** - TypeScript execution
- **Git** - Version control

---

## Installation

### Prerequisites
- Windows 10/11
- Node.js 18+
- Python 3.8+
- Git

### Setup Steps

**1. Clone Repository**
```bash
git clone https://github.com/yourusername/secure-data-wiper.git
cd secure-data-wiper
```

**2. Backend Setup**
```bash
cd backend
npm install
mkdir -p wiping-engine
npm run dev
# Output: 🚀 Server running on port 5000
```

**3. Frontend Setup** (new terminal)
```bash
cd frontend
npm install
npm start
# Opens: http://localhost:3000
```

**4. Verify Installation**
```bash
curl http://localhost:5000/api/health
# Response: {"status":"OK",...}
```

---

<!-- ## Screenshots

### System Scan Screen
```
┌─────────────────────────────────────────┐
│ 🔒 Secure Data Wiper                   │
├─────────────────────────────────────────┤
│ Scanning your system...                 │
│ ████████████░░░░░░░░░░░░░░░ 50%        │
│                                         │
│ Detecting drives and permissions...     │
└─────────────────────────────────────────┘
```

### Dashboard
```
┌─────────────────────────────────────────┐
│ Detected Devices:                       │
├─────────────────────────────────────────┤
│ ✓ C:\ (SSD, 500GB, NTFS)               │
│   Available: 250GB                      │
│                                         │
│ ✓ D:\ (HDD, 1TB, NTFS)                 │
│   Available: 500GB                      │
│                                         │
│ [Wipe Files] [Free Space] [Full Drive] │
└─────────────────────────────────────────┘
```

### Wiping Progress
```
┌─────────────────────────────────────────┐
│ 🔄 Secure Wiping in Progress...        │
├─────────────────────────────────────────┤
│ File: /documents/sensitive.pdf          │
│ Progress: ████████░░ 80%                │
│ Pass: 2 of 3                            │
│ Files: 1,247 / 1,580                    │
│ Time remaining: ~5 minutes              │
│ Speed: 12.5 MB/s                        │
│                                         │
│ [Pause] [Cancel]                        │
└─────────────────────────────────────────┘
```

### Completion Report
```
┌─────────────────────────────────────────┐
│ ✅ Wipe Completed Successfully         │
├─────────────────────────────────────────┤
│ Files wiped: 1,580                      │
│ Data cleared: 2.3 GB                    │
│ Security: NIST SP 800-88 Standard       │
│ Session ID: SWP-2024-1A2B3C            │
│                                         │
│ [📄 PDF Report] [📁 JSON Details]      │
│ [📧 Email Report] [🏠 Dashboard]       │
└─────────────────────────────────────────┘
```

--- -->

## Challenges Faced

### 1. **Cross-Platform File System Access**
- **Challenge**: Different filesystems (NTFS, ext4, APFS) require different approaches
- **Solution**: Abstracted file access through Python wrapper with platform detection

### 2. **Real-Time Progress Updates**
- **Challenge**: WebSocket connection drops required fallback mechanism
- **Solution**: Implemented dual Socket.io + HTTP polling system

### 3. **TypeScript Configuration**
- **Challenge**: Node.js doesn't recognize `.ts` files by default
- **Solution**: Configured `ts-node` and `tsconfig.json` properly with nodemon

### 4. **NIST Compliance Implementation**
- **Challenge**: Understanding correct overwrite patterns for different security levels
- **Solution**: Researched NIST SP 800-88 standards and implemented verified patterns

### 5. **Windows Admin Privileges**
- **Challenge**: File wiping requires elevated permissions
- **Solution**: Added permission checking with user elevation prompts

### 6. **Large File Handling**
- **Challenge**: Wiping large files (>1GB) required memory-efficient streaming
- **Solution**: Implemented chunked reading/writing to prevent memory overload

### 7. **Report Generation**
- **Challenge**: Creating professional PDF reports dynamically
- **Solution**: Used puppeteer to generate PDF from HTML templates

### 8. **Session Management**
- **Challenge**: Tracking multiple concurrent wiping sessions
- **Solution**: Implemented Map-based session store with cleanup mechanisms

---

## What I Learned

### Architecture & Design Patterns
- ✅ Monorepo structure benefits for full-stack projects
- ✅ Socket.io implementation for real-time bidirectional communication
- ✅ Separation of concerns (Frontend/Backend/Engine)
- ✅ Error handling at multiple layers

### Security Concepts
- ✅ NIST SP 800-88 data destruction standards
- ✅ DoD 5220.22-M wiping specifications
- ✅ Cryptographic randomness (secrets module)
- ✅ Digital signatures and verification systems

### Full-Stack Development
- ✅ React component lifecycle and state management
- ✅ Express middleware and routing
- ✅ TypeScript type safety benefits
- ✅ Integration between frontend and backend APIs

### System-Level Programming
- ✅ File system operations and permissions
- ✅ Multi-pass overwriting algorithms
- ✅ Progress tracking and ETA calculations
- ✅ Child process communication with Python

### Practical DevOps
- ✅ Development vs production configurations
- ✅ Environment variables and secrets management
- ✅ Logging and debugging techniques
- ✅ Performance optimization strategies

### Professional Development
- ✅ Importance of comprehensive documentation
- ✅ User trust through transparency
- ✅ Audit trails for compliance
- ✅ Clear error messaging and user feedback

---

## Author

**[Your Full Name]**

- 🔗 LinkedIn: [linkedin.com/in/yourprofile](https://linkedin.com/in/yourprofile)
- 🐙 GitHub: [github.com/yourusername](https://github.com/yourusername)
- 📧 Email: aqdasmirza2003@gmail.com

---

## License

MIT License - See LICENSE file for details

## Version

**v1.0.0** - Production Ready Prototype

---

**Last Updated**: June 2024

For more information, visit the [GitHub Repository](https://github.com/yourusername/secure-data-wiper)