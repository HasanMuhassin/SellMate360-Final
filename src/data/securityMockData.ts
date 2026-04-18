// Security Module Mock Data

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'manager' | 'staff' | 'cashier';
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  level: 'info' | 'warning' | 'critical';
  timestamp: Date;
}

export interface LoginAttempt {
  id: string;
  email: string;
  userName?: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  location?: string;
  failureReason?: string;
  timestamp: Date;
}

export interface RoleChange {
  id: string;
  targetUserId: string;
  targetUserName: string;
  targetUserEmail: string;
  previousRole: 'admin' | 'manager' | 'staff' | 'cashier' | null;
  newRole: 'admin' | 'manager' | 'staff' | 'cashier';
  changedByUserId: string;
  changedByUserName: string;
  reason?: string;
  timestamp: Date;
}

// Mock Audit Logs
export const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    userId: 'user-1',
    userName: 'Super Admin',
    userRole: 'admin',
    action: 'UPDATE',
    resource: 'products',
    resourceId: 'prod-123',
    details: 'Updated product price from LKR 5,000 to LKR 4,500',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    level: 'info',
    timestamp: new Date('2024-01-20T14:30:00'),
  },
  {
    id: '2',
    userId: 'user-1',
    userName: 'Super Admin',
    userRole: 'admin',
    action: 'DELETE',
    resource: 'orders',
    resourceId: 'ORD-000456',
    details: 'Cancelled order ORD-000456 - Customer requested cancellation',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    level: 'warning',
    timestamp: new Date('2024-01-20T13:45:00'),
  },
  {
    id: '3',
    userId: 'user-2',
    userName: 'Store Manager',
    userRole: 'manager',
    action: 'CREATE',
    resource: 'coupons',
    resourceId: 'coup-789',
    details: 'Created new coupon SAVE20 - 20% discount',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    level: 'info',
    timestamp: new Date('2024-01-20T11:20:00'),
  },
  {
    id: '4',
    userId: 'user-1',
    userName: 'Super Admin',
    userRole: 'admin',
    action: 'UPDATE',
    resource: 'settings',
    resourceId: 'payment-config',
    details: 'Modified payment gateway credentials',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    level: 'critical',
    timestamp: new Date('2024-01-20T10:15:00'),
  },
  {
    id: '5',
    userId: 'user-3',
    userName: 'Sales Staff',
    userRole: 'staff',
    action: 'UPDATE',
    resource: 'orders',
    resourceId: 'ORD-000789',
    details: 'Updated order status to "shipped"',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0',
    level: 'info',
    timestamp: new Date('2024-01-20T09:30:00'),
  },
  {
    id: '6',
    userId: 'user-1',
    userName: 'Super Admin',
    userRole: 'admin',
    action: 'UPDATE',
    resource: 'users',
    resourceId: 'user-5',
    details: 'Changed user role from staff to manager',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    level: 'critical',
    timestamp: new Date('2024-01-19T16:45:00'),
  },
  {
    id: '7',
    userId: 'user-4',
    userName: 'POS Cashier',
    userRole: 'cashier',
    action: 'CREATE',
    resource: 'pos_orders',
    resourceId: 'POS-001234',
    details: 'Created POS order - Total: LKR 12,500',
    ipAddress: '192.168.1.200',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    level: 'info',
    timestamp: new Date('2024-01-19T15:20:00'),
  },
  {
    id: '8',
    userId: 'user-2',
    userName: 'Store Manager',
    userRole: 'manager',
    action: 'UPDATE',
    resource: 'inventory',
    resourceId: 'SKU-5678',
    details: 'Adjusted stock: -50 units (Damaged goods)',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    level: 'warning',
    timestamp: new Date('2024-01-19T14:00:00'),
  },
  {
    id: '9',
    userId: 'user-1',
    userName: 'Super Admin',
    userRole: 'admin',
    action: 'DELETE',
    resource: 'users',
    resourceId: 'user-10',
    details: 'Deactivated user account: former.employee@store.lk',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    level: 'critical',
    timestamp: new Date('2024-01-19T11:30:00'),
  },
  {
    id: '10',
    userId: 'user-2',
    userName: 'Store Manager',
    userRole: 'manager',
    action: 'CREATE',
    resource: 'resellers',
    resourceId: 'res-456',
    details: 'Approved reseller application: newreseller@example.com',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    level: 'info',
    timestamp: new Date('2024-01-18T16:00:00'),
  },
];

// Mock Login Attempts
export const mockLoginAttempts: LoginAttempt[] = [
  {
    id: '1',
    email: 'admin@sellmate360.lk',
    userName: 'Super Admin',
    success: true,
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    location: 'Colombo, Sri Lanka',
    timestamp: new Date('2024-01-20T09:30:00'),
  },
  {
    id: '2',
    email: 'manager@sellmate360.lk',
    userName: 'Store Manager',
    success: true,
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    location: 'Colombo, Sri Lanka',
    timestamp: new Date('2024-01-20T08:15:00'),
  },
  {
    id: '3',
    email: 'admin@sellmate360.lk',
    success: false,
    ipAddress: '203.115.72.55',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    location: 'Mumbai, India',
    failureReason: 'Invalid password',
    timestamp: new Date('2024-01-20T07:45:00'),
  },
  {
    id: '4',
    email: 'unknown@attacker.com',
    success: false,
    ipAddress: '185.220.101.45',
    userAgent: 'python-requests/2.28.0',
    location: 'Unknown',
    failureReason: 'User not found',
    timestamp: new Date('2024-01-20T06:30:00'),
  },
  {
    id: '5',
    email: 'cashier@sellmate360.lk',
    userName: 'POS Cashier',
    success: true,
    ipAddress: '192.168.1.200',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    location: 'Colombo, Sri Lanka',
    timestamp: new Date('2024-01-20T10:00:00'),
  },
  {
    id: '6',
    email: 'admin@sellmate360.lk',
    success: false,
    ipAddress: '185.220.101.45',
    userAgent: 'python-requests/2.28.0',
    location: 'Unknown',
    failureReason: 'Invalid password',
    timestamp: new Date('2024-01-20T06:31:00'),
  },
  {
    id: '7',
    email: 'admin@sellmate360.lk',
    success: false,
    ipAddress: '185.220.101.45',
    userAgent: 'python-requests/2.28.0',
    location: 'Unknown',
    failureReason: 'Invalid password',
    timestamp: new Date('2024-01-20T06:32:00'),
  },
  {
    id: '8',
    email: 'staff@sellmate360.lk',
    userName: 'Sales Staff',
    success: true,
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0',
    location: 'Colombo, Sri Lanka',
    timestamp: new Date('2024-01-19T17:45:00'),
  },
  {
    id: '9',
    email: 'manager@sellmate360.lk',
    success: false,
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    location: 'Colombo, Sri Lanka',
    failureReason: 'Invalid 2FA code',
    timestamp: new Date('2024-01-19T08:10:00'),
  },
  {
    id: '10',
    email: 'warehouse@sellmate360.lk',
    userName: 'Warehouse Staff',
    success: true,
    ipAddress: '192.168.2.50',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    location: 'Kelaniya, Sri Lanka',
    timestamp: new Date('2024-01-19T08:00:00'),
  },
];

// Mock Role Changes
export const mockRoleChanges: RoleChange[] = [
  {
    id: '1',
    targetUserId: 'user-5',
    targetUserName: 'John Smith',
    targetUserEmail: 'john.smith@sellmate360.lk',
    previousRole: 'staff',
    newRole: 'manager',
    changedByUserId: 'user-1',
    changedByUserName: 'Super Admin',
    reason: 'Promoted to branch manager role',
    timestamp: new Date('2024-01-19T16:45:00'),
  },
  {
    id: '2',
    targetUserId: 'user-8',
    targetUserName: 'Sarah Johnson',
    targetUserEmail: 'sarah.j@sellmate360.lk',
    previousRole: null,
    newRole: 'cashier',
    changedByUserId: 'user-1',
    changedByUserName: 'Super Admin',
    reason: 'New employee onboarding',
    timestamp: new Date('2024-01-18T10:30:00'),
  },
  {
    id: '3',
    targetUserId: 'user-6',
    targetUserName: 'Mike Davis',
    targetUserEmail: 'mike.d@sellmate360.lk',
    previousRole: 'cashier',
    newRole: 'staff',
    changedByUserId: 'user-2',
    changedByUserName: 'Store Manager',
    reason: 'Role upgrade after training completion',
    timestamp: new Date('2024-01-15T14:20:00'),
  },
  {
    id: '4',
    targetUserId: 'user-9',
    targetUserName: 'Emily Chen',
    targetUserEmail: 'emily.c@sellmate360.lk',
    previousRole: 'manager',
    newRole: 'admin',
    changedByUserId: 'user-1',
    changedByUserName: 'Super Admin',
    reason: 'Elevated to admin for system maintenance',
    timestamp: new Date('2024-01-12T09:00:00'),
  },
  {
    id: '5',
    targetUserId: 'user-10',
    targetUserName: 'Tom Wilson',
    targetUserEmail: 'tom.w@sellmate360.lk',
    previousRole: 'staff',
    newRole: 'cashier',
    changedByUserId: 'user-2',
    changedByUserName: 'Store Manager',
    reason: 'Temporary reassignment to POS duties',
    timestamp: new Date('2024-01-10T11:15:00'),
  },
];

// Security stats
export const securityStats = {
  totalLogins24h: 45,
  failedLogins24h: 8,
  suspiciousAttempts: 3,
  activeUsers: 12,
  criticalActions7d: 15,
  roleChanges30d: 5,
};
