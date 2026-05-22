export function renderTermsOfUseView(container: HTMLElement): void {
  container.innerHTML = '';

  const wrapper = document.createElement('div');

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <h2 style="font-size:1.25rem;margin-bottom:4px">Terms of Use</h2>
    <p style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:16px">Effective date: March 29, 2026</p>

    <div class="section-label" style="margin-top:0">Acceptance of Terms</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      By accessing or using Creighton Cycle Tracker ("the App"), you agree to these Terms of Use. If you do not agree, please do not use the App.
    </p>

    <div class="section-label">Description of Service</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      The App is a personal fertility cycle charting tool based on the Creighton Model FertilityCare System (CrMS). It allows you to record daily observations, view your chart, and optionally sync your data across devices via an encrypted server backup.
    </p>

    <div class="section-label">Not Medical Advice</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      The App is a personal charting tool and is not a substitute for instruction from a certified FertilityCare Practitioner. The Creighton Model FertilityCare System should be learned through proper instruction. The App does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider or FertilityCare Practitioner for guidance regarding your fertility or health.
    </p>

    <div class="section-label">User Accounts</div>
    <p style="font-size:0.875rem;margin-bottom:8px">
      Creating an account is optional. If you create an account, you are responsible for maintaining the confidentiality of your password and for all activity that occurs under your account.
    </p>
    <p style="font-size:0.875rem;margin-bottom:16px">
      You agree to provide accurate information when registering and to notify us if you believe your account has been compromised.
    </p>

    <div class="section-label">Data & Privacy</div>
    <p style="font-size:0.875rem;margin-bottom:8px">
      Your use of the App is also governed by our <a href="#/privacy" style="color:var(--accent)">Privacy Policy</a>.
    </p>
    <p style="font-size:0.875rem;margin-bottom:16px">
      All health data is stored locally on your device. If you choose to sync, your data is end-to-end encrypted before being sent to our server using a key derived from your password. No one else can read your synced data, including the server operator.
    </p>

    <div class="section-label">Acceptable Use</div>
    <p style="font-size:0.875rem;margin-bottom:8px">
      You agree not to:
    </p>
    <ul style="font-size:0.875rem;margin:0 0 16px 20px">
      <li>Use the App for any unlawful purpose</li>
      <li>Attempt to gain unauthorized access to the server or other users' data</li>
      <li>Interfere with or disrupt the App's operation</li>
      <li>Reverse-engineer, decompile, or disassemble the App beyond what is permitted by law</li>
    </ul>

    <div class="section-label">Intellectual Property & Trademarks</div>
    <p style="font-size:0.875rem;margin-bottom:8px">
      The App and its original content, features, and functionality are owned by Jacob Stephens.
    </p>
    <p style="font-size:0.875rem;margin-bottom:8px">
      This app is an independent project and is not affiliated with, endorsed by, or sponsored by FertilityCare Centers of America, Creighton University, or the Saint Paul VI Institute. Creighton Model FertilityCare\u2122 System is a trademark of FertilityCare Centers of America. Used here for descriptive purposes only.
    </p>
    <p style="font-size:0.875rem;margin-bottom:16px">
      All other trademarks referenced in the App belong to their respective owners.
    </p>

    <div class="section-label">Disclaimer of Warranties</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      The App is provided "as is" and "as available" without warranties of any kind, whether express or implied. We do not warrant that the App will be uninterrupted, error-free, or free of harmful components. You use the App at your own risk.
    </p>

    <div class="section-label">Limitation of Liability</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      To the fullest extent permitted by law, Jacob Stephens shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, arising out of or related to your use of the App. In no event shall total liability exceed the amount you have paid to use the App (which is zero for the free tier).
    </p>

    <div class="section-label">Termination</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      We may suspend or terminate your access to the App at any time, with or without cause, with or without notice. You may stop using the App at any time. Upon termination, your right to use the App ceases immediately, but your locally stored data remains on your device.
    </p>

    <div class="section-label">Changes to These Terms</div>
    <p style="font-size:0.875rem;margin-bottom:16px">
      We may update these Terms from time to time. The revised version will be posted on this page with an updated effective date. Continued use of the App after changes constitutes acceptance of the new terms.
    </p>

    <div class="section-label">Contact</div>
    <p style="font-size:0.875rem;margin-bottom:0">
      If you have questions about these terms, contact Jacob Stephens at
      <a href="mailto:jacob@stephens.page" style="color:var(--accent)">jacob@stephens.page</a>.
    </p>
  `;

  wrapper.appendChild(card);

  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn-secondary btn-block';
  backBtn.textContent = 'Back to Settings';
  backBtn.style.marginTop = '4px';
  backBtn.addEventListener('click', () => {
    window.location.hash = '/settings';
  });
  wrapper.appendChild(backBtn);

  container.appendChild(wrapper);
}
