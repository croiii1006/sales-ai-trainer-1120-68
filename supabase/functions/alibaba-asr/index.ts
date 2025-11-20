import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 获取阿里云 Access Token
async function getAccessToken(accessKeyId: string, accessKeySecret: string): Promise<string> {
  const tokenUrl = 'https://nls-meta.cn-shanghai.aliyuncs.com/pop/2018-05-18/tokens';
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      AccessKeyId: accessKeyId,
      AccessKeySecret: accessKeySecret,
      Action: 'CreateToken',
      Format: 'JSON',
      RegionId: 'cn-shanghai',
      Version: '2018-05-18',
    }),
  });

  const result = await response.json();
  
  if (!response.ok || !result.Token?.Id) {
    throw new Error(`Failed to get access token: ${JSON.stringify(result)}`);
  }

  return result.Token.Id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    const accessKeyId = Deno.env.get('ALIBABA_ACCESS_KEY_ID');
    const accessKeySecret = Deno.env.get('ALIBABA_ACCESS_KEY_SECRET');
    
    if (!accessKeyId || !accessKeySecret) {
      throw new Error('Alibaba Cloud credentials not configured');
    }

    console.log('Getting access token...');
    const token = await getAccessToken(accessKeyId, accessKeySecret);
    console.log('Access token obtained');
    
    // 将 base64 转换为二进制
    const audioBuffer = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
    console.log('Audio data length:', audioBuffer.length, 'bytes');
    
    // 阿里云一句话识别 API
    const url = 'https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/asr';
    
    // 构建请求参数
    const params = new URLSearchParams({
      appkey: accessKeyId, // 使用完整的 AccessKeyId 作为 appkey
      format: 'opus',
      sample_rate: '16000',
      enable_intermediate_result: 'false',
      enable_punctuation_prediction: 'true',
      enable_inverse_text_normalization: 'true',
    });

    console.log('Calling Alibaba ASR API...');
    
    // 调用阿里云 API
    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-NLS-Token': token, // 使用 Token 认证
      },
      body: audioBuffer,
    });

    const result = await response.json();
    console.log('Alibaba ASR response:', result);

    if (!response.ok || result.status !== 20000000) {
      throw new Error(`Alibaba API error: ${result.message || result.status_text || 'Unknown error'}`);
    }

    return new Response(
      JSON.stringify({ 
        text: result.result || '',
        requestId: result.header?.task_id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in alibaba-asr:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
