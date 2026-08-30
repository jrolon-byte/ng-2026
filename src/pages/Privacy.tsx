import LegalPage from '../components/LegalPage';

export default function Privacy() {
  return (
    <LegalPage title="Privacy" titleAccent="Policy." effectiveDate="August 30, 2026">
      <p>
        NotifyGrid, operated by RoloniumCapital LLC doing business as
        RoloniumLabs ("NotifyGrid," "we," "us"), is a text-messaging platform
        that helps local businesses stay in touch with their customers. This policy
        explains what information we collect, why we collect it, and what we do
        with it — in plain language, because that's how we do everything. It
        applies to our website, web application, and iOS app.
      </p>

      <h2>Two kinds of people use NotifyGrid</h2>
      <p>
        <strong>Business customers</strong> — the shops and businesses that sign
        up for NotifyGrid to message their customers. If that's you, most of this
        policy is about your account.
      </p>
      <p>
        <strong>Message recipients</strong> — people who receive texts from a
        business that uses NotifyGrid. If that's you: the business you gave your
        number to controls that relationship, and we process your information on
        their behalf. Your fastest exits are below in "Opting out of messages."
      </p>

      <h2>What we collect</h2>
      <p>
        <strong>Account information.</strong> When a business signs up we collect
        the business name, the owner's name, a username, a password, and a phone
        number. Passwords are hashed by our authentication provider; we never see
        or store them in plain text.
      </p>
      <p>
        <strong>Contact lists.</strong> Business customers upload or add their
        customers' names and phone numbers, along with each contact's
        subscription status (opted in or opted out). This data belongs to the
        business that uploaded it. We use it only to provide the service to that
        business — never for our own marketing, and never to build cross-business
        profiles.
      </p>
      <p>
        <strong>Messages.</strong> We store the messages sent through the
        platform, replies received, and delivery status for each message, so
        businesses can see what was sent, to whom, and whether it arrived.
      </p>
      <p>
        <strong>Payment information.</strong> Payments are processed by Stripe.
        Your card number never touches our servers; we keep only what Stripe
        gives us to run your subscription (such as your plan and payment status).
      </p>
      <p>
        <strong>Device information (iOS app).</strong> If you use our iOS app
        and allow notifications, we store your device's push notification token
        so we can notify you about things like customer replies and campaign
        completion. That's what it's for, and that's all it's for.
      </p>
      <p>
        <strong>What we don't collect.</strong> We don't run third-party
        advertising or tracking. We don't sell personal information. We don't use
        your data, or your customers' data, to train AI models or to market to
        anyone.
      </p>

      <h2>SMS consent is never shared</h2>
      <p>
        Phone numbers and text-messaging opt-in consent collected through
        NotifyGrid will not be shared with, or sold to, third parties or
        affiliates for their marketing or promotional purposes. Consent a
        customer gives one business stays with that business.
      </p>

      <h2>Opting out of messages</h2>
      <p>
        Any message recipient can opt out at any time by replying{' '}
        <strong>STOP</strong> (or STOPALL, UNSUBSCRIBE, CANCEL, END, or QUIT) to
        any message. We record the opt-out immediately and the business can no
        longer text that number through NotifyGrid. Reply <strong>START</strong>{' '}
        to resubscribe, or <strong>HELP</strong> for help. Message and data rates
        may apply; message frequency varies by business.
      </p>

      <h2>Who we share data with</h2>
      <p>
        We share data only with the service providers that make NotifyGrid work,
        and only what each one needs:
      </p>
      <ul>
        <li><strong>Twilio</strong> — delivers the text messages.</li>
        <li><strong>Stripe</strong> — processes payments.</li>
        <li><strong>Supabase</strong> — hosts our database and authentication.</li>
        <li><strong>Netlify</strong> — hosts our application.</li>
        <li><strong>Apple</strong> — delivers push notifications to the iOS app.</li>
      </ul>
      <p>
        Beyond that, we disclose information only if the law requires it, or if
        it's necessary to protect the safety or rights of our users or the
        public. If NotifyGrid is ever acquired or merged, data would transfer
        under this same policy's protections.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep account data, contact lists, and message history for as long as
        the business account is active, so businesses have their records. When an
        account is closed, or on a verified deletion request, we delete the data
        within a reasonable period — except the minimum we're required to retain,
        such as opt-out records (which we must keep so an opted-out number stays
        opted out) and billing records required for tax and accounting.
      </p>

      <h2>Security</h2>
      <p>
        Data is encrypted in transit and at rest by our infrastructure providers.
        Access is restricted to what each part of the system needs. No system is
        perfectly secure, but we treat your customer list the way we'd want our
        own treated.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask us what personal information we hold about you, ask us to
        correct it, or ask us to delete it, by emailing{' '}
        <a href="mailto:support@notifygrid.com">support@notifygrid.com</a>. If
        you're a message recipient, we may direct part of your request to the
        business that holds your relationship, since the data is theirs — but
        we'll help either way. We respond to every request and never
        discriminate against you for making one.
      </p>

      <h2>Children</h2>
      <p>
        NotifyGrid is a business tool, not a service for children. We don't
        knowingly collect personal information from anyone under 13. If you
        believe a child's information has ended up in our systems, email us and
        we'll delete it.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If we change this policy in a way that matters, we'll update the
        effective date at the top and notify business customers in the app or by
        message. Continued use after a change means the new version applies.
      </p>

      <h2>Contact us</h2>
      <p>
        NotifyGrid · RoloniumCapital LLC dba RoloniumLabs
        <br />
        Kissimmee, Florida, USA
        <br />
        <a href="mailto:support@notifygrid.com">support@notifygrid.com</a>
      </p>
    </LegalPage>
  );
}
