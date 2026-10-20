import { NextRequest, NextResponse } from 'next/server';
import { templateManager } from '@/lib/templates';

/**
 * Individual Template Management
 * 
 * DELETE /api/templates/[name] - Delete a template
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const result = await templateManager.deleteTemplate(params.name);

    return NextResponse.json({
      success: true,
      message: `Template ${params.name} deleted successfully`,
      result,
    });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to delete template' 
      },
      { status: 500 }
    );
  }
}
