export const DEFAULT_LANG = 'en_US'

const dict = {
  'Starting Forgejo!': 0,
  'Store not found': 1,
  'Web Interface': 2,
  'Forgejo is ready': 3,
  'Forgejo is still starting. If this persists, please check the logs.': 4,
  'Create your first admin user and password': 5,
  'Web UI and git (HTTP)': 6,
  'Web UI for Forgejo. Also used for git over HTTP': 7,
  'git (SSH)': 8,
  'Used for git over SSH': 9,
  'Username': 10,
  'The username for the administrator account': 11,
  'Email': 12,
  'The email address for the administrator account': 13,
  'Create Admin User': 14,
  'Success': 15,
  'Your admin user has been created': 16,
  'Password': 17,
  'Configure SMTP': 18,
  'Add SMTP credentials for sending emails': 19,
  'Enable Registrations': 20,
  'Disable Registrations': 21,
  'Registrations are currently disabled. Run this action to permit new registrations.': 22,
  'Registrations are currently enabled. Run this action to prohibit new registrations.': 23,
  'Anyone with your Forgejo URL will be able to create an account on your server, which represents a security risk. Be careful!': 24,
  'Admin User': 25,
  'Reset Admin Password': 26,
  'Generate a new password for an admin user': 27,
  'Your admin user password has been reset': 28,
  'URL': 29,
  'Set Primary Url': 30,
  'Choose which of your Forgejo http URLs should serve as the primary URL for the purposes of creating links, sending invites, etc.': 31,
} as const

export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
