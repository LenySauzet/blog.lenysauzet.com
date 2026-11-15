'use client';

import { useEffect } from 'react';

import { ErrorBody, type ErrorProps } from './_components/ErrorBody';

export default function Error({ error, retry }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorBody what="This page" retry={retry} />;
}
