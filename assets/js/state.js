
// VersicherungsFuchs – sessionStorage state helpers
const VF_ANSWERS_KEY = 'vf_answers';
const VF_LEAD_KEY    = 'vf_lead';

function vfSaveAnswers(answers) {
  sessionStorage.setItem(VF_ANSWERS_KEY, JSON.stringify(answers));
}
function vfGetAnswers() {
  try { return JSON.parse(sessionStorage.getItem(VF_ANSWERS_KEY)) || {}; }
  catch(e) { return {}; }
}
function vfSaveLead(lead) {
  sessionStorage.setItem(VF_LEAD_KEY, JSON.stringify(lead));
}
function vfGetLead() {
  try { return JSON.parse(sessionStorage.getItem(VF_LEAD_KEY)) || {}; }
  catch(e) { return {}; }
}
function vfClearAll() {
  sessionStorage.removeItem(VF_ANSWERS_KEY);
  sessionStorage.removeItem(VF_LEAD_KEY);
}
function vfAnswerCount() {
  return Object.keys(vfGetAnswers()).length;
}
