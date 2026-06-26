import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// Sigue la altura del teclado a mano. Hace falta porque KeyboardAvoidingView no
// empuja bien dentro de un Modal pageSheet en iOS: con esto subimos el footer
// (botones) justo por encima del teclado.
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s = Keyboard.addListener(showEvt, (e) => setHeight(e.endCoordinates.height));
    const h = Keyboard.addListener(hideEvt, () => setHeight(0));
    return () => { s.remove(); h.remove(); };
  }, []);
  return height;
}
