import Link from "next/link";

export default function ReturnPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0f0a0d] px-4 py-10 text-white md:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#171116] shadow-2xl">
          <div className="border-b border-white/10 bg-gradient-to-r from-[#8d2048] via-[#a72d59] to-[#8a1e47] px-6 py-8">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-yellow-300">
              Meenal Silk
            </p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">
              Returns Policy
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-white/80 md:text-base">
              We want you to shop with confidence. Below are the return,
              exchange and cancellation rules for products purchased from
              Meenal Silk And Sarees.
            </p>
          </div>

          <div className="space-y-8 px-6 py-8 md:px-8">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold text-yellow-400">
                1. Returns Eligibility
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Returns are accepted only for products that are damaged,
                defective, wrongly delivered, or significantly different from
                the order placed. The product must be unused, unwashed,
                undamaged, and returned with original packaging, tags, invoice,
                and accessories if any.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold text-yellow-400">
                2. Return Window
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Customers must raise a return request within <b>7 days</b> of
                delivery. Requests made after the return window may not be
                accepted.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold text-yellow-400">
                3. Non-Returnable Items
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/75">
                The following items are not eligible for return:
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-white/75">
                <li>• Sarees that have been worn, washed, altered or damaged after delivery</li>
                <li>• Customized or specially arranged products</li>
                <li>• Products without original tags or packaging</li>
                <li>• Products returned without valid reason or proof</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold text-yellow-400">
                4. Exchange Policy
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Exchange may be offered based on product availability. If the
                requested product is unavailable, refund or store replacement
                options may be discussed with the customer.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold text-yellow-400">
                5. Refund Policy
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Once the returned item is received and inspected, eligible
                refunds will be processed.
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-white/75">
                <li>• Online paid orders: refund to original payment method</li>
                <li>• Cash on Delivery orders: refund to bank account / UPI as shared by customer</li>
                <li>• Refund processing time may take 5 to 7 working days after approval</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold text-yellow-400">
                6. Cancellation Policy
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Orders can be cancelled before dispatch. Once the order is
                shipped or marked as processing for dispatch, cancellation may
                not be possible.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold text-yellow-400">
                7. How to Request a Return
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/75">
                To request a return, exchange, or cancellation, contact our
                support team with your order details, mobile number, product
                name, and reason for return. Photos of the issue may be
                required for damaged or wrong products.
              </p>
            </section>

            <section className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5">
              <h2 className="text-xl font-semibold text-yellow-300">
                8. Important Note
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/80">
                Meenal Silk And Sarees reserves the right to accept or reject
                any return request after product inspection and verification of
                the issue reported.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}