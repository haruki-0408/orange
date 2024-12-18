import { Suspense } from 'react';
import WorkflowClient from './WorkflowClient';
import { getWorkflowHistories, getCategories } from './actions/workflow';

export default async function Home() {
  const [categories, histories] = await Promise.all([
    getCategories(),
    getWorkflowHistories()
  ]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkflowClient 
        initialCategories={categories}
        initialHistories={histories}
      />
    </Suspense>
  );
}
