export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  let strength: 'weak' | 'medium' | 'strong' = 'weak'

  if (password.length < 8) {
    errors.push('密码长度必须至少8个字符')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含至少一个数字')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('密码必须包含至少一个特殊字符')
  }

  if (errors.length === 0) {
    strength = 'strong'
  } else if (errors.length <= 2) {
    strength = 'medium'
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  }
}

export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'strong':
      return '#52c41a'
    case 'medium':
      return '#faad14'
    case 'weak':
      return '#ff4d4f'
    default:
      return '#d9d9d9'
  }
}

export function getPasswordStrengthText(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'strong':
      return '强'
    case 'medium':
      return '中'
    case 'weak':
      return '弱'
    default:
      return ''
  }
}
