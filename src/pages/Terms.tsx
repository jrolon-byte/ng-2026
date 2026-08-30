import LegalPage from '../components/LegalPage';

export default function Terms() {
  return (
    <LegalPage title="Terms of" titleAccent="Use." effectiveDate="August 30, 2026">
      <p>
        These terms are the agreement between you and NotifyGrid ("NotifyGrid,"
        "we," "us") when you use our website, web application, or iOS app. By
        creating an account or using the service, you agree to them. We've kept
        them as plain as the law allows.
      </p>

      <h2>1. What NotifyGrid is</h2>
      <p>
        NotifyGrid is a text-messaging platform that lets businesses send SMS
        and MMS campaigns to their own customers, receive replies, and track
        delivery. It is a tool for messaging people who asked to hear from you —
        not a tool for cold outreach.
      </p>

      <h2>2. Your account</h2>
      <p>
        You must be at least 18 and using NotifyGrid for a business to open an
        account. You're responsible for keeping your password private and for
        everything done under your account. Tell us immediately at{' '}
        <a href="mailto:support@notifygrid.com">support@notifygrid.com</a> if you
        think your account has been compromised.
      </p>

      <h2>3. Consent is your responsibility</h2>
      <p>
        This is the most important section. When you upload a contact or send a
        message, you are telling us that you have that person's prior express
        consent to text them, as required by law — including the Telephone
        Consumer Protection Act (TCPA) and applicable state laws — and by CTIA
        and carrier guidelines. You must honor opt-outs (NotifyGrid enforces
        STOP replies automatically), identify your business in your messages,
        and only message people who gave <em>your business</em> their number for
        this purpose.
      </p>
      <p>
        Bought lists, scraped numbers, and "they came in once in 2019" lists
        don't qualify. If a legal claim arises because you messaged someone
        without proper consent, that responsibility is yours (see section 9).
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to use NotifyGrid to send messages that:</p>
      <ul>
        <li>are illegal, fraudulent, or deceptive, including phishing or impersonation;</li>
        <li>
          violate carrier content policies — including content involving sex,
          hate, alcohol, firearms, tobacco, or cannabis (carriers block these
          categories regardless of your local laws);
        </li>
        <li>are harassing, abusive, or sent to numbers that opted out through another channel;</li>
        <li>attempt to evade carrier filtering, registration, or rate limits.</li>
      </ul>
      <p>
        We can suspend or terminate accounts that break these rules, and carrier
        or regulatory fines caused by your content or your list are your
        responsibility.
      </p>

      <h2>5. Billing</h2>
      <p>
        Paid plans and message pricing are shown in the app at purchase, and
        payments are processed by Stripe. Subscriptions renew automatically
        until you cancel; you can cancel any time from your billing portal and
        keep access through the end of the period you paid for. Except where the
        law says otherwise, payments are non-refundable — but if we've genuinely
        let you down, email us and we'll make it right.
      </p>

      <h2>6. Your data stays yours</h2>
      <p>
        Your contact lists and message history belong to you. We use them only
        to run the service, as described in our{' '}
        <a href="/privacy">Privacy Policy</a>. The NotifyGrid software, name,
        and design belong to us. Neither of us gets to use the other's property
        beyond what these terms allow.
      </p>

      <h2>7. Service availability</h2>
      <p>
        We work hard to keep NotifyGrid fast and reliable, but we provide it
        "as is" and "as available." Text-message delivery ultimately depends on
        carriers and on Twilio, and no one can guarantee that every message
        arrives, or arrives on time. We don't make warranties beyond what these
        terms state, and we disclaim implied warranties to the extent the law
        allows.
      </p>

      <h2>8. Limits on liability</h2>
      <p>
        To the maximum extent permitted by law, NotifyGrid is not liable for
        indirect, incidental, special, or consequential damages — including lost
        profits or lost business — arising from your use of the service. Our
        total liability for any claim is limited to the amount you paid us in
        the twelve months before the claim arose. Some jurisdictions don't allow
        certain limits, so parts of this section may not apply to you.
      </p>

      <h2>9. Indemnification</h2>
      <p>
        You agree to defend and hold NotifyGrid harmless from claims, fines, and
        expenses (including reasonable attorneys' fees) arising from your
        content, your contact lists, your violation of these terms, or your
        violation of messaging laws such as the TCPA.
      </p>

      <h2>10. The iOS app</h2>
      <p>
        The NotifyGrid iOS app is licensed to you, not sold, for use on Apple
        devices you own or control, per the App Store terms. Apple has no
        obligation to provide support or maintenance for the app and is not
        responsible for addressing any claims relating to it; Apple is a
        third-party beneficiary of these terms and may enforce them. You
        represent that you are not in a country under a U.S. government embargo
        and are not on any U.S. government restricted-party list.
      </p>

      <h2>11. Ending things</h2>
      <p>
        You can close your account whenever you like. We can suspend or close
        accounts that violate these terms, that create legal or carrier risk, or
        that go unpaid — with notice where practical. Sections that by their
        nature should survive (like 6, 8, and 9) survive termination.
      </p>

      <h2>12. Changes and the fine print</h2>
      <p>
        We may update these terms; when we do, we'll change the effective date
        above and notify you in the app for material changes. These terms are
        governed by the laws of the State of Florida, and disputes will be
        resolved in the state or federal courts located in Osceola County,
        Florida. If any part of these terms is found unenforceable, the rest
        stands. These terms plus the Privacy Policy are the whole agreement
        between us about the service.
      </p>

      <h2>Contact us</h2>
      <p>
        NotifyGrid · Kissimmee, Florida, USA
        <br />
        <a href="mailto:support@notifygrid.com">support@notifygrid.com</a>
      </p>
    </LegalPage>
  );
}
