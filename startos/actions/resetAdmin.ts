import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { getPassword, mount } from '../utils'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  username: Value.dynamicSelect(async ({ effects }) => {
    const result = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'forgejo' },
      mount,
      'list-admin-users',
      async (subc) => {
        const execResult = await subc.execFail(
          ['forgejo', 'admin', 'user', 'list', '--admin', '--work-path', '/data'],
          { user: 'git' },
        )
        return execResult
      },
    )

    const lines = (result.stdout as string).trim().split('\n')

    // Remove header
    const dataLines = lines.slice(1)

    const admins = dataLines.map((line) => line.trim().split(/\s+/)[1]) // split on whitespace

    return {
      name: i18n('Admin User'),
      default: admins[0],
      values: admins.reduce(
        (obj, name) => ({
          ...obj,
          [name]: name,
        }),
        {},
      ),
    }
  }),
})

export const resetAdmin = sdk.Action.withInput(
  // id
  'reset-admin',

  // metadata
  async ({ effects }) => {
    return {
      name: i18n('Reset Admin Password'),
      description: i18n('Generate a new password for an admin user'),
      warning: null,
      allowedStatuses: 'only-running',
      group: null,
      visibility: 'enabled',
    }
  },

  // form input specification
  inputSpec,

  // optionally pre-fill the input form
  async ({ effects }) => {},

  // the execution function
  async ({ effects, input }) => {
    const password = getPassword()

    const passwordResult = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'forgejo' },
      mount,
      'reset-admin-password',
      async (subc) => {
        const execResult = await subc.exec(
          [
            'forgejo',
            'admin',
            'user',
            'change-password',
            '--username',
            input.username,
            '--password',
            password,
            '--must-change-password=false',
            '--work-path',
            '/data',
          ],
          {
            user: 'git',
          },
        )
        return execResult
      },
    )

    if (passwordResult.exitCode !== 0) {
      const errorMsg =
        passwordResult.stderr?.toString() ||
        passwordResult.stdout?.toString() ||
        'Unknown error'
      throw new Error(`Failed to reset admin password: ${errorMsg}`)
    }

    // Show the generated password
    return {
      version: '1',
      title: i18n('Success'),
      message: i18n('Your admin user password has been reset'),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: input.username,
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: password,
            masked: true,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
