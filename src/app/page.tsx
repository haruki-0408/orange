import { Suspense } from 'react';
import WorkflowClient from './WorkflowClient';

async function getCategories() {
  'use server'
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
    cache: 'force-cache',
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch categories');
  }
  
  return res.json();
}

export default async function Home() {
  const categories = await getCategories();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkflowClient initialCategories={categories} />
    </Suspense>
  );
}
