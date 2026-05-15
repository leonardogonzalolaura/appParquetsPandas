import { encryptData, decryptData } from '../utils/security';

const PROFILES_STORAGE_KEY = 's3_explorer_profiles';
const ACTIVE_PROFILE_KEY = 's3_explorer_active_id';

class ProfileService {
  /**
   * Obtiene todos los perfiles guardados
   */
  static async getProfiles() {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) return [];

    try {
      const encryptedProfiles = JSON.parse(raw);
      const profiles = [];

      for (const p of encryptedProfiles) {
        profiles.push({
          id: p.id,
          name: p.name,
          region: p.region,
          defaultBucket: p.defaultBucket,
          // Las llaves se mantienen encriptadas hasta que se necesiten
          accessKeyEnc: p.accessKey,
          secretKeyEnc: p.secretKey
        });
      }
      return profiles;
    } catch (e) {
      console.error('Error parsing profiles:', e);
      return [];
    }
  }

  /**
   * Guarda un nuevo perfil
   */
  static async saveProfile(name, config) {
    //const profiles = await this.getProfiles();
    
    // Encriptar credenciales sensibles
    const encryptedAccessKey = await encryptData(config.accessKey);
    const encryptedSecretKey = await encryptData(config.secretKey);

    const newProfile = {
      id: Date.now().toString(),
      name,
      region: config.region,
      defaultBucket: config.defaultBucket || '',
      accessKey: encryptedAccessKey,
      secretKey: encryptedSecretKey
    };

    // Guardamos en localStorage (todos los perfiles en un array)
    // Nota: Guardamos la versión con keys ya encriptadas
    const rawProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
    const list = rawProfiles ? JSON.parse(rawProfiles) : [];
    list.push(newProfile);
    
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(list));
    return newProfile;
  }

  /**
   * Obtiene el perfil activo completo (desencriptado)
   */
  static async getActiveProfile() {
    const id = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (!id) return null;

    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) return null;

    const list = JSON.parse(raw);
    const profile = list.find(p => p.id === id);
    if (!profile) return null;

    return {
      ...profile,
      accessKey: await decryptData(profile.accessKey),
      secretKey: await decryptData(profile.secretKey)
    };
  }

  static setActiveProfile(id) {
    if (id) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  }

  /**
   * Actualiza un perfil existente (re-encripta las credenciales)
   */
  static async updateProfile(id, config) {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) return;
    const list = JSON.parse(raw);
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return;

    const encryptedAccessKey = await encryptData(config.accessKey);
    const encryptedSecretKey = await encryptData(config.secretKey);

    list[idx] = {
      ...list[idx],
      name: config.name,
      region: config.region,
      defaultBucket: config.defaultBucket || '',
      accessKey: encryptedAccessKey,
      secretKey: encryptedSecretKey,
    };
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(list));
  }

  /**
   * Actualiza los buckets de un perfil existente
   */
  static updateProfileBuckets(id, defaultBucket) {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) return;
    const list = JSON.parse(raw);
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return;
    list[idx].defaultBucket = defaultBucket;
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(list));
  }

  static deleteProfile(id) {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) return;
    const list = JSON.parse(raw);
    const newList = list.filter(p => p.id !== id);
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(newList));
    
    if (localStorage.getItem(ACTIVE_PROFILE_KEY) === id) {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  }
}

export default ProfileService;
