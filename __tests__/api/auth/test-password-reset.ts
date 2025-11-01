import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'node:fs'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://birugqyuqhiahxvxeyqg.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

async function testPasswordReset() {
  console.log('🔧 Testing Password Reset Flow\n')

  const testEmail = 'hello@idlecreative.co.uk'

  // Step 1: Trigger password reset
  console.log(`1. Sending password reset email to ${testEmail}...`)
  const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
    redirectTo: 'http://localhost:3000/auth/callback?type=recovery',
  })

  if (error) {
    console.error('❌ Error sending reset email:', error.message)
    return
  }

  console.log('✅ Password reset email sent!')
  console.log('\n📧 Check your email for the reset link')
  console.log('🔗 The link should redirect to: http://localhost:3000/update-password')

  // Step 2: Verify the update-password page exists
  console.log('\n2. Verifying update-password page exists...')
  const updatePageExists = fs.existsSync('./app/update-password/page.tsx')

  if (updatePageExists) {
    console.log('✅ Update password page exists')
  } else {
    console.log('❌ Update password page missing!')
  }

  // Step 3: Check auth callback route
  console.log('\n3. Verifying auth callback route...')
  const callbackExists = fs.existsSync('./app/auth/callback/route.ts')

  if (callbackExists) {
    console.log('✅ Auth callback route exists')

    // Check if it handles recovery type
    const callbackContent = fs.readFileSync('./app/auth/callback/route.ts', 'utf-8')
    if (callbackContent.includes('type === \'recovery\'')) {
      console.log('✅ Callback handles password recovery')
    } else {
      console.log('⚠️  Callback might not handle recovery properly')
    }
  } else {
    console.log('❌ Auth callback route missing!')
  }

  console.log('\n📝 Summary:')
  console.log('- Email should arrive within 1-2 minutes')
  console.log('- Link expires after 1 hour')
  console.log('- Make sure your dev server is running on port 3000')
  console.log('- Check spam folder if email doesn\'t arrive')
}

// Run the test
testPasswordReset().catch(console.error)
