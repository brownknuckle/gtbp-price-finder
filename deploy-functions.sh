#!/bin/bash
# Deploy all GTBP edge functions to the user's Supabase project
set -e

PROJECT_REF="jbftwbduusnjoufsotpq"

echo "Deploying all edge functions to project $PROJECT_REF..."

supabase functions deploy product-search --project-ref $PROJECT_REF
supabase functions deploy price-scrape --project-ref $PROJECT_REF
supabase functions deploy trending --project-ref $PROJECT_REF

echo "All functions deployed."
