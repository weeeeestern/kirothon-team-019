// Only an explicitly configured URI/Web key belongs here. Server keys never do.
export async function requestOdsayWeb(url: URL, timeout: number, signal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, timeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      credentials: 'omit',
      redirect: 'error',
      // Let the browser send its real registered origin; never forge a Referer.
      referrerPolicy: 'strict-origin-when-cross-origin',
      headers: { Accept: 'application/json' },
    });
    const reader = response.body?.getReader();
    if (!reader) throw new Error('경로 응답을 읽지 못했어요. 다시 검색해 주세요.');
    const parts: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        size += next.value.byteLength;
        if (size > 8 * 1024 * 1024) {
          await reader.cancel();
          throw new Error('검색 결과가 너무 커서 표시하지 못했어요. 더 가까운 장소로 검색해 주세요.');
        }
        parts.push(next.value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
    let body;
    try { body = JSON.parse(new TextDecoder().decode(bytes)); }
    catch { throw new Error('경로 응답을 읽지 못했어요. 다시 검색해 주세요.'); }
    const problem = Array.isArray(body?.error) ? body.error[0] : body?.error;
    const detail = String(problem?.message ?? body?.message ?? '');
    const code = String(problem?.code ?? '');
    if (response.status === 401 || response.status === 403 || /ApiKeyAuthFailed/i.test(detail)) {
      throw new Error('ODsay Web 인증을 확인하지 못했어요. 앱 관리자가 URI용 키와 현재 사이트의 허용 도메인을 확인해야 해요.');
    }
    if (response.status === 429 || /quota|limit|exceed/i.test(detail)) throw new Error('검색 요청이 잠시 많아요. 잠시 후 다시 검색해 주세요.');
    if (['3', '4', '5', '6', '-98', '-99'].includes(code)) {
      throw new Error(code === '-98' ? '출발지와 도착지가 너무 가까워 대중교통 경로가 없어요.' : '이 구간의 대중교통 경로를 찾지 못했어요. 다른 장소를 골라 주세요.');
    }
    if (!response.ok || body?.error || body?.errorType || !body || typeof body !== 'object') {
      throw new Error('ODsay 길찾기에 연결하지 못했어요. 잠시 후 다시 검색해 주세요.');
    }
    return body;
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (controller.signal.aborted) throw new Error('응답이 늦어지고 있어요. 다시 검색해 주세요.');
    // Browser network errors can contain the full URL, including the Web key.
    if (error instanceof TypeError) throw new Error('ODsay에 연결하지 못했어요. 인터넷 연결과 허용 도메인 설정을 확인해 주세요.');
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
