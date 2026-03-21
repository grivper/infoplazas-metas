import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * Hook para obtener perfil del usuario autenticado
 * @returns { display_name, role } del perfil o null
 */
export function useUserProfile() {
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          if (profile.display_name) {
            setUserName(profile.display_name);
          } else if (user.email) {
            setUserName(user.email);
          }
          if (profile.role) {
            setUserRole(profile.role);
          }
        } else if (user.email) {
          setUserName(user.email);
        }
      }
      setLoading(false);
    };
    getUserProfile();
  }, []);

  return { userName, userRole, loading };
}
