/**
 * Utilidad de seguridad para encriptar datos sensibles en el navegador
 * usando la Web Crypto API nativa.
 */

const ENCRYPTION_KEY_NAME = 's3_explorer_master_key';

// Generar o recuperar una clave de encriptación persistente
async function getMasterKey() {
  let keyData = localStorage.getItem(ENCRYPTION_KEY_NAME);
  if (!keyData) {
    // Si no existe, generamos una aleatoria (esto es una obfuscación fuerte)
    const randomArray = new Uint8Array(32);
    window.crypto.getRandomValues(randomArray);
    keyData = btoa(String.fromCharCode(...randomArray));
    localStorage.setItem(ENCRYPTION_KEY_NAME, keyData);
  }

  const rawKey = new Uint8Array(
    atob(keyData).split('').map(char => char.charCodeAt(0))
  );

  return await window.crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encripta un texto
 */
export async function encryptData(text) {
  try {
    const key = await getMasterKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(text);

    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedText
    );

    // Retornamos IV + Ciphertext codificado en base64
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
}

/**
 * Desencripta un texto
 */
export async function decryptData(encryptedBase64) {
  try {
    if (!encryptedBase64) return '';
    const key = await getMasterKey();
    const combined = new Uint8Array(
      atob(encryptedBase64).split('').map(char => char.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return '***ERROR***'; // Retornamos algo seguro si falla
  }
}
