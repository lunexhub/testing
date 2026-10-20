import { NextRequest, NextResponse } from 'next/server';
import { templateManager } from '@/lib/templates';

/**
 * Send Template Message API
 * 
 * POST /api/templates/send
 * Body: { to, template, language, parameters, headerMedia }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { to, template, language, parameters, headerMedia } = body;

    if (!to || !template) {
      return NextResponse.json(
        { error: 'to and template are required' },
        { status: 400 }
      );
    }

    const result = await templateManager.sendTemplate({
      to,
      template,
      language: language || 'en_US',
      parameters,
      headerMedia,
    });

    return NextResponse.json({
      success: true,
      messageId: result.id || result.messageId,
      message: 'Template message sent successfully',
    });
  } catch (error) {
    console.error('Send template error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to send template' 
      },
      { status: 500 }
    );
  }
}
