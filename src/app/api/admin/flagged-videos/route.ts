import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://192.168.100.51:4000';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    let response: Response;
    try {
      // Use fetch with a 10s timeout to mirror the common connect timeout problem.
      // In environments supporting AbortController (Node 18+), use it:
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      response = await fetch(`${API_BASE_URL}/api/admin/flagged-videos`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        console.error('Connect timeout when fetching flagged videos:', fetchError);
        return NextResponse.json(
          {
            error: 'Upstream service timed out (ND_ERR_CONNECT_TIMEOUT)',
            detail: 'Could not connect to backend API in time',
            code: 'ND_ERR_CONNECT_TIMEOUT'
          },
          { status: 504 }
        );
      }
      console.error('Error connecting to backend API:', fetchError);
      return NextResponse.json(
        {
          error: 'Error connecting to upstream API',
          detail: fetchError.message,
          code: fetchError.code || 'ND_ERR_CONNECT'
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (_) {
        errorData = { error: 'Unknown error from upstream service.' };
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching flagged videos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
