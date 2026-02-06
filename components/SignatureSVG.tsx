'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const signatureSvgVariants = {
  initial: {
    rotate: -12.5,
  },
  revealed: {
    rotate: -12.5,
    transition: {
      staggerChildren: 0.25,
    },
  },
};

const signaturePathVariantsFast = {
  initial: {
    opacity: 0,
    pathLength: 0,
  },
  revealed: {
    opacity: 1,
    pathLength: 1,
    transition: {
      pathLength: {
        duration: 0.25,
        ease: 'linear' as const,
      },
    },
  },
};

const SignatureSVG = () => {
  const ref = useRef(null);
  const isVisible = useInView(ref);

  return (
    <div ref={ref} className="">
      <motion.svg
        initial="initial"
        animate={isVisible ? 'revealed' : 'initial'}
        variants={signatureSvgVariants}
        width="206"
        height="51"
        viewBox="0 0 206 51"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          variants={signaturePathVariantsFast}
          d="M34.751 2.66394C34.751 2.66394 18.518 24.3747 10.9577 32.3879C5.11817 38.5772 0.75 41.8681 0.75 38.1639C0.75 22.6317 32.75 44.6639 40.251 26.1639"
          stroke="white"
          strokeLinecap="round"
        />
        <motion.path
          variants={signaturePathVariantsFast}
          d="M46.7518 24.6639C48.7518 25.1639 51.7518 24.6639 51.7518 22.1639C51.7518 19.6144 43.2518 24.0459 43.2518 25.1639C43.2518 26.1639 45.7518 28.6639 56.2518 25.6639"
          stroke="white"
          strokeLinecap="round"
        />
        <motion.path
          variants={signaturePathVariantsFast}
          d="M59.2518 22.6639L57.8589 26.8427C57.8274 26.9372 57.9384 27.0147 58.0163 26.9524L62.6218 23.268C62.6807 23.2208 62.7686 23.2523 62.7844 23.326C63.3576 25.9968 65.98 29.9758 72.2518 25.6639"
          stroke="white"
          strokeLinecap="round"
        />
        <motion.path
          variants={signaturePathVariantsFast}
          d="M74.7517 23.1639C71.2225 30.6146 77.9768 26.5002 82.0124 23.352C82.0887 23.2925 82.1968 23.3617 82.1706 23.4549C79.1271 34.3103 72.1894 51.6461 65.2517 49.6639C57.5595 47.4662 77.9184 31.6639 88.2517 25.6639"
          stroke="white"
          strokeLinecap="round"
        />
        <motion.path
          variants={signaturePathVariantsFast}
          d="M114.25 12.957C117.583 10.457 122.95 4.65697 117.75 1.45697C111.25 -2.54303 81.0551 11.3088 93.7501 20.957C106.25 30.457 101.25 36.957 93.7501 40.457C86.0076 44.0701 80.2501 40.457 84.7501 35.957C88.1042 32.6029 94.7501 26.957 116.75 25.957"
          stroke="white"
          strokeLinecap="round"
        />
        <motion.path
          variants={signaturePathVariantsFast}
          d="M128.752 24.6639C126.918 26.3306 122.752 28.9639 120.752 26.1639C118.252 22.6639 131.252 19.6639 129.752 22.6639C128.252 25.6639 127.752 30.1639 135.752 25.6639"
          stroke="white"
          strokeLinecap="round"
        />
        <motion.path
          variants={signaturePathVariantsFast}
          d="M139.252 22.6639C138.085 23.9973 136.452 26.6639 139.252 26.6639C142.752 26.6639 143.752 21.1639 144.252 23.6639C144.752 26.1639 144.252 27.6639 148.252 27.6639C151.452 27.6639 152.918 26.6639 153.252 26.1639"
          stroke="white"
          strokeLinecap="round"
        />
        <motion.path
          variants={signaturePathVariantsFast}
          d="M155.252 25.664C159.085 24.164 166.192 22.2074 160.752 26.164C155.252 30.164 166.418 26.8306 170.752 25.664"
          stroke="white"
          strokeLinecap="round"
        />
        <motion.path
          variants={signaturePathVariantsFast}
          d="M175.252 24.6639C177.252 24.6639 181.152 24.1639 180.752 22.1639C180.252 19.6639 170.752 24.1639 172.252 26.1639C173.752 28.1639 181.252 27.6639 185.252 25.6639"
          stroke="white"
          strokeLinecap="round"
        />

        <motion.path
          variants={signaturePathVariantsFast}
          d="M199.252 6.16394C192.585 15.9973 179.352 36.8639 179.752 41.6639M178.252 14.6639C185.752 13.9973 201.552 13.1639 204.752 15.1639"
          stroke="white"
          strokeLinecap="round"
        />
      </motion.svg>
    </div>
  );
};

export default SignatureSVG;
