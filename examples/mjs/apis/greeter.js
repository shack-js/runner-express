import os from 'os'
export const hello = async (firstName, lastName) => `hello ${firstName} ${lastName}! from ${os.platform()}`