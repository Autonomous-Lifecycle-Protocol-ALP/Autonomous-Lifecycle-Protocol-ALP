import api from '../utils/api';

/**
 * Run self-reflection critique on spec or code text.
 */
export async function critiqueSpec(content, targetType = 'SPEC', autoRefine = true) {
  try {
    const res = await api.post('/reasoning/critique', { content, targetType, autoRefine });
    return res.data;
  } catch (err) {
    return {
      success: false,
      error: err.response?.data?.error || err.message,
    };
  }
}

/**
 * Verify Merkle tree reasoning trace integrity.
 */
export async function verifyReasoningTrace(chainId = 'chain-8200') {
  try {
    const res = await api.get(`/reasoning/verify/${chainId}`);
    return res.data;
  } catch (err) {
    return {
      success: false,
      error: err.response?.data?.error || err.message,
    };
  }
}

/**
 * Negotiate task allocations across specialized agent bids.
 */
export async function negotiateTasks(nodeIds, bids) {
  try {
    const res = await api.post('/reasoning/negotiate', { nodeIds, bids });
    return res.data;
  } catch (err) {
    return {
      success: false,
      error: err.response?.data?.error || err.message,
    };
  }
}
