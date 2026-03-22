export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f9] px-4 py-12 md:px-6">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="text-4xl font-bold text-[#233f99] md:text-5xl">
          About Meenal Silk
        </h1>

        <p className="mt-6 text-lg text-slate-600">
          Meenal Silk Saree Store is a premium boutique offering elegant,
          traditional and modern sarees for every occasion.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-[#233f99]">
            Premium Quality
          </h3>
          <p className="mt-3 text-slate-500">
            We provide handpicked silk sarees with the finest fabric and design.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-[#233f99]">
            Trusted Store
          </h3>
          <p className="mt-3 text-slate-500">
            Hundreds of happy customers trust our quality and service.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-[#233f99]">
            Affordable Price
          </h3>
          <p className="mt-3 text-slate-500">
            Best prices with premium quality sarees for every budget.
          </p>
        </div>
      </div>
    </main>
  );
}