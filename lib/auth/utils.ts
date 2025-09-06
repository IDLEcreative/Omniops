import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function getUser() {
  const supabase = await createClient()
  if (!supabase) {
    return null
  }
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

export async function requireAuth() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return user
}

export async function signOut() {
  const supabase = await createClient()
  if (!supabase) {
    redirect('/login')
    return
  }
  await supabase.auth.signOut()
  redirect('/login')
}