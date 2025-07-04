// utils/emailValidation.ts
// Sistema de validação de email local para bloquear emails temporários

/**
 * Lista de domínios de email temporário conhecidos
 */
const TEMPORARY_EMAIL_DOMAINS = [
  // Temp-mail.org e variações
  'temp-mail.org',
  'tempmail.org',
  'temporary-mail.org',
  'temp-mail.io',
  'temp-mail.net',
  
  // 10minutemail
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '20minutemail.com',
  
  // Guerrilla Mail
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  
  // Mailinator
  'mailinator.com',
  'mailinator.net',
  'mailinator.org',
  
  // YOPmail
  'yopmail.com',
  'yopmail.net',
  'yopmail.org',
  
  // ThrowAwayMail
  'throwaway.email',
  'throwawaymails.com',
  
  // Outros populares
  'fakeinbox.com',
  'fakemail.net',
  'dispostable.com',
  'maildrop.cc',
  'tempinbox.com',
  'sharklasers.com',
  'emailondeck.com',
  'getairmail.com',
  'getnada.com',
  'mailnesia.com',
  'tempail.com',
  'trashmail.com',
  'mohmal.com',
  'mytrashmail.com',
  'no-spam.ws',
  'nowmymail.com',
  'spamgourmet.com',
  'tempinbox.net',
  'tempr.email',
  'tmails.net',
  'tmpmail.net',
  'tmpmail.org',
  'zetmail.com',
  'anonymbox.com',
  'bccto.me',
  'chacuo.net',
  'dumpmail.de',
  'email60.com',
  'emailias.com',
  'filzmail.com',
  'incognitomail.org',
  'jetable.org',
  'koszmail.pl',
  'kulturbetrieb.info',
  'kurzepost.de',
  'm4ilweb.info',
  'mail.by',
  'mailcatch.com',
  'maileater.com',
  'mailexpire.com',
  'mailforspam.com',
  'mailmoat.com',
  'mailnull.com',
  'mailshell.com',
  'mailsino.com',
  'mailzilla.com',
  'mailzilla.org',
  'mintemail.com',
  'mt2014.com',
  'mytempemail.com',
  'noclickemail.com',
  'objectmail.com',
  'obobbo.com',
  'oneoffemail.com',
  'opentrash.com',
  'pookmail.com',
  'proxymail.eu',
  'rcpt.at',
  'rppkn.com',
  'safe-mail.net',
  'selfdestructingmail.com',
  'sendspamhere.com',
  'sogetthis.com',
  'soodonims.com',
  'spambog.com',
  'spambog.de',
  'spambog.ru',
  'spamex.com',
  'spamfree24.org',
  'spamherelots.com',
  'spamhereplease.com',
  'spamhole.com',
  'spaml.de',
  'spammotel.com',
  'spamobox.com',
  'spamspot.com',
  'superrito.com',
  'tempemail.com',
  'tempemail.net',
  'tempinbox.com',
  'tempmailer.com',
  'tempmailer.de',
  'tempomail.fr',
  'temporarily.de',
  'temporaryforwarding.com',
  'thankyou2010.com',
  'thisisnotmyrealemail.com',
  'tmailinator.com',
  'trbvm.com',
  'trialmail.de',
  'wh4f.org',
  'whatpayne.com',
  'willselfdestruct.com',
  'winemaven.info',
  'wronghead.com',
  'wuzupmail.net',
  'xemaps.com',
  'xents.com',
  'yuurok.com',
  'zoemail.org',
  
  // Domínios brasileiros conhecidos
  'emailtemporario.com.br',
  'tempmail.com.br',
  
  // Mais recentes e variações
  'disposablemail.com',
  'temporarymails.com'
]

/**
 * Lista de domínios confiáveis (whitelist)
 */
const TRUSTED_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'protonmail.com',
  'uol.com.br',
  'bol.com.br',
  'ig.com.br',
  'terra.com.br',
  'globo.com',
  'r7.com',
  'zipmail.com.br',
  'live.com',
  'msn.com',
  'aol.com'
]

/**
 * Interface para resultado da validação
 */
interface EmailValidationResult {
  isValid: boolean
  isTemporary: boolean
  isTrusted: boolean
  domain: string
  message?: string
}

/**
 * Valida se um email é temporário
 */
export function validateEmail(email: string): EmailValidationResult {
  // Validação básica de formato
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      isTemporary: false,
      isTrusted: false,
      domain: '',
      message: 'Formato de email inválido'
    }
  }

  // Extrair domínio
  const domain = email.toLowerCase().split('@')[1]

  // Verificar se é domínio confiável
  const isTrusted = TRUSTED_EMAIL_DOMAINS.includes(domain)
  
  // Verificar se é temporário
  const isTemporary = TEMPORARY_EMAIL_DOMAINS.includes(domain)

  // Se é confiável, sempre permitir
  if (isTrusted) {
    return {
      isValid: true,
      isTemporary: false,
      isTrusted: true,
      domain
    }
  }

  // Se é temporário, bloquear
  if (isTemporary) {
    return {
      isValid: false,
      isTemporary: true,
      isTrusted: false,
      domain,
      message: 'Emails temporários não são permitidos. Use um email permanente.'
    }
  }

  // Verificações adicionais por padrões suspeitos
  const suspiciousPatterns = [
    /temp/i,
    /disposable/i,
    /throwaway/i,
    /temporary/i,
    /fake/i,
    /trash/i,
    /spam/i,
    /mail.*drop/i,
    /\d+minute/i, // 10minute, 20minute, etc
    /^[a-z]+\d+\.(com|org|net)$/ // padrões como abc123.com
  ]

  const isDomainSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(domain)
  )

  if (isDomainSuspicious) {
    return {
      isValid: false,
      isTemporary: true,
      isTrusted: false,
      domain,
      message: 'Este provedor de email não é permitido. Use um email permanente.'
    }
  }

  // Email passou em todas as verificações
  return {
    isValid: true,
    isTemporary: false,
    isTrusted: false,
    domain
  }
}

/**
 * Verificar se é email corporativo
 */
export function isCorporateEmail(email: string): boolean {
  const corporateDomains = [
    // Brasileiros
    'petrobras.com.br',
    'vale.com',
    'itau.com.br',
    'bradesco.com.br',
    'magazineluiza.com.br',
    'ambev.com.br',
    'embraer.com.br',
    
    // Internacionais
    'google.com',
    'microsoft.com',
    'apple.com',
    'amazon.com',
    'facebook.com',
    'tesla.com',
    'netflix.com',
    'spotify.com'
  ]

  const domain = email.toLowerCase().split('@')[1]
  return corporateDomains.includes(domain)
}