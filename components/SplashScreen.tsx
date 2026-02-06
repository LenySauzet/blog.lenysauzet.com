'use client';
import { useSplashScreenStore } from '@/hook/use-splashScreen-store';
import { motion, Transition } from 'framer-motion';
import { useEffect } from 'react';
import SignatureSVG from './SignatureSVG';

export default function SplashScreen() {
  const { setVisibility } = useSplashScreenStore();

  useEffect(() => {
    setInterval(() => {
      setVisibility(false);
    }, 3000);
  }, [setVisibility]);

  const splashScreenTransition: Transition = {
    duration: 0.7,
    delay: 3.5,
    ease: 'easeInOut',
  };

  const signatureSVGTransition: Transition = {
    duration: 0.5,
    delay: 3,
  };

  return (
    <motion.div
      className="bg-black h-screen w-full fixed top-0 left-0 flex items-center justify-center z-50"
      initial={{ height: '100vh' }}
      animate={{ height: '0vh' }}
      transition={splashScreenTransition}
    >
      <motion.div
        initial={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
        animate={{ opacity: 0, filter: 'blur(8px)', scale: 1.08 }}
        transition={signatureSVGTransition}
      >
        <SignatureSVG />
      </motion.div>
    </motion.div>
  );
}
