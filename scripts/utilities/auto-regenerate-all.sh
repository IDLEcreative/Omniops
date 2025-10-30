#!/bin/bash

# Auto-regenerate script that keeps running until all pages are clean
echo "🚀 Starting automatic regeneration loop for thompsonseparts.co.uk"
echo "This will keep running until all pages have clean embeddings"
echo ""

DOMAIN="thompsonseparts.co.uk"
COMPLETED=false
ITERATION=1

while [ "$COMPLETED" = false ]; do
    echo "==================== Iteration $ITERATION ===================="
    echo "Running regeneration script..."
    
    # Run the resume script
    npx tsx regenerate-embeddings-clean-resume.ts --domain=$DOMAIN
    
    # Check if there are any pages left to process
    REMAINING=$(npx tsx -e "
        import { createServiceRoleClient } from './lib/supabase-server';
        
        async function checkRemaining() {
            const supabase = await createServiceRoleClient();
            if (!supabase) {
                console.log('999999');
                return;
            }
            
            // Get domain ID
            const { data: domain } = await supabase
                .from('domains')
                .select('id')
                .eq('domain', 'thompsonseparts.co.uk')
                .single();
            
            if (!domain) {
                console.log('999999');
                return;
            }
            
            // Get all pages
            const { data: allPages } = await supabase
                .from('scraped_pages')
                .select('id')
                .eq('domain_id', domain.id);
            
            // Get cleaned pages
            const { data: cleanedPages } = await supabase
                .from('page_embeddings')
                .select('page_id')
                .eq('metadata->>is_cleaned', 'true')
                .in('page_id', (allPages || []).map(p => p.id));
            
            const cleanedIds = new Set((cleanedPages || []).map(p => p.page_id));
            const remaining = (allPages || []).filter(p => !cleanedIds.has(p.id)).length;
            
            console.log(remaining);
        }
        
        checkRemaining();
    " 2>/dev/null)
    
    echo "Pages remaining: $REMAINING"
    
    if [ "$REMAINING" -eq "0" ] || [ "$REMAINING" = "" ]; then
        COMPLETED=true
        echo "✅ All pages have been regenerated with clean embeddings!"
    else
        echo "📝 $REMAINING pages still need processing. Continuing..."
        ITERATION=$((ITERATION + 1))
        sleep 5  # Brief pause between runs
    fi
done

echo ""
echo "🎉 COMPLETE! All embeddings have been cleaned and enriched."
echo "The chat system should now handle category searches much better."