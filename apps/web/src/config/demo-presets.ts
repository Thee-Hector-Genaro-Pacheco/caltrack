export type UserRole =
  | 'ADMINISTRATOR'
  | 'SUPERVISOR'
  | 'QA_REVIEWER'
  | 'TECHNICIAN'
  | 'METROLOGY_MANAGER'
  | 'DEMO_VIEWER';

export interface DemoRolePreset {
  label: string;
  email: string;
  role: UserRole;
  publicPassword?: string;
  description: string;
}

export const DEMO_ROLE_PRESETS: DemoRolePreset[] = [
  {
    label: 'Demo Viewer',
    email: 'demo@caltrack.com',
    role: 'DEMO_VIEWER',
    publicPassword: 'DemoOnly123!',
    description: 'Public portfolio read-only access',
  },
  {
    label: 'Administrator',
    email: 'admin.demo@caltrack.com',
    role: 'ADMINISTRATOR',
    description: 'Full registry & standards access',
  },
  {
    label: 'Supervisor',
    email: 'supervisor.demo@caltrack.com',
    role: 'SUPERVISOR',
    description: 'Manage orders and schedules',
  },
  {
    label: 'QA Reviewer',
    email: 'qa.demo@caltrack.com',
    role: 'QA_REVIEWER',
    description: 'Approve & reject calibrations',
  },
  {
    label: 'Technician',
    email: 'technician.demo@caltrack.com',
    role: 'TECHNICIAN',
    description: 'Submit calibrations',
  },
  {
    label: 'Metrology Manager',
    email: 'manager.demo@caltrack.com',
    role: 'METROLOGY_MANAGER',
    description: 'NIST standards management',
  },
];
