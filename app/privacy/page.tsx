export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[32px] border border-stone-200/70 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-stone-900">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">We respect your privacy and only use your information to process orders, improve service, and communicate important updates.</p>
        <p className="mt-4 text-sm leading-7 text-stone-600">When you use the shopping assistant, your messages and relevant public product information are sent to Google Gemini to generate replies. The free-tier service may use submitted content to improve Google products. Private order records are accessed through your secure account page and are not retrieved by the chat assistant. Chats stay in this browser tab and can be cleared using New chat. Avoid sending passwords, payment-card details, or other sensitive information. Google may retain and review submitted content under its applicable policies. Photos used for visual search are processed by our server and are not sent to Gemini.</p>
        <p className="mt-4 text-sm leading-7 text-stone-600">If you choose to subscribe, we use your verified account email to send promotional newsletters and offers through our email provider, Resend. You can manage this choice in your profile email preferences or use the unsubscribe link in any marketing email. Account, security, and order-related messages are separate from marketing preferences.</p>
        <p className="mt-4 text-sm leading-7 text-stone-600">Product IDs from your recent browsing are stored in this browser to show recently viewed items and personalize recommendations. This history is not sent to an AI provider. You can remove it with Clear browsing history in the Recently viewed section.</p>
      </section>
    </main>
  );
}
