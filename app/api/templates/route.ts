import { NextRequest, NextResponse } from 'next/server';
import { templateManager } from '@/lib/templates';

/**
 * Template Management API
 * 
 * GET /api/templates - List all templates
 * POST /api/templates - Create a new template
 */

export async function GET(request: NextRequest) {
  try {
    const templates = await templateManager.listTemplates();
    
    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('List templates error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to list templates' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, category, language, bodyText, header, footer, buttons } = body;

    if (!name || !bodyText) {
      return NextResponse.json(
        { error: 'name and bodyText are required' },
        { status: 400 }
      );
    }

    const result = await templateManager.createTemplate({
      name,
      category: category || 'UTILITY',
      language: language || 'en_US',
      body: bodyText,
      header,
      footer,
      buttons,
    });

    return NextResponse.json({
      success: true,
      template: result,
      message: 'Template created and submitted for approval. Allow 24-48 hours for Meta review.',
    });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create template' 
      },
      { status: 500 }
    );
  }
}
