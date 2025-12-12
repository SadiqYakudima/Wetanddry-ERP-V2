/**
 * VAPID Key Generator for Web Push Notifications
 * 
 * Run this script to generate VAPID keys:
 * npx ts-node scripts/generate-vapid-keys.ts
 * 
 * Then add the generated keys to your .env.local file
 */

import webpush from 'web-push'

const vapidKeys = webpush.generateVAPIDKeys()

console.log('\n' + '='.repeat(60))
console.log('🔐 VAPID Keys Generated Successfully!')
console.log('='.repeat(60) + '\n')

console.log('Add these to your .env.local file:\n')
console.log('─'.repeat(60))
console.log('# Web Push Notification Keys')
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log(`VAPID_SUBJECT=mailto:admin@wetndry.com`)
console.log('─'.repeat(60))

console.log('\n📋 Quick Setup:')
console.log('─'.repeat(60))
console.log('1. Copy the environment variables above')
console.log('2. Paste them into your .env.local file')
console.log('3. Replace VAPID_SUBJECT email with your actual email')
console.log('4. Restart your Next.js dev server')
console.log('5. Users can now subscribe to push notifications!')

console.log('\n⚠️  Security Notes:')
console.log('─'.repeat(60))
console.log('• VAPID_PRIVATE_KEY must be kept SECRET')
console.log('• NEXT_PUBLIC_VAPID_PUBLIC_KEY is safe to expose')
console.log('• Generate NEW keys for production (don\'t reuse dev keys)')
console.log('• Never commit private keys to version control')

console.log('\n✅ Setup complete!\n')
