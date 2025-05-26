// utils/pslist-wrapper.mjs
import psList from 'ps-list';

export async function getProcesses() {
  return await psList();
}
