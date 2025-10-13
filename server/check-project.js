import fs from 'fs';

const keyFile = '/Users/bestflow/Documents/projects/household-budget/server/household-budget-key.json';
const key = JSON.parse(fs.readFileSync(keyFile, 'utf8'));

console.log('📋 פרטי Service Account:');
console.log('  Project ID:', key.project_id);
console.log('  Client Email:', key.client_email);
console.log('  Client ID:', key.client_id);

console.log('\n🔗 קישורים חשובים:');
console.log('  1. הפעל Vision API:', `https://console.cloud.google.com/apis/library/vision.googleapis.com?project=${key.project_id}`);
console.log('  2. בדוק Billing:', `https://console.cloud.google.com/billing/linkedaccount?project=${key.project_id}`);
console.log('  3. בדוק Service Accounts:', `https://console.cloud.google.com/iam-admin/serviceaccounts?project=${key.project_id}`);
