const ProjectsPage = () => {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-5">Projects</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">TPulseLink</h2>
        <p className="mb-3">
          A decentralized application (dApp) focused on token distribution and community engagement.
        </p>
        <a
          href="https://worldcoin.org/mini-app?app_id=app_15daccf5b7d4ec9b7dbba044a8fdeab5&path=app/token/0x460b7B7ade9B02C4aEB8281bbb301Fc57Aa14230"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          target="_blank"
          rel="noopener noreferrer"
        >
          Buy Token
        </a>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">Project 2</h2>
        <p className="mb-3">Description of Project 2. Add more details here.</p>
        <a
          href="#"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn More
        </a>
      </section>

      {/* Add more project sections as needed */}
    </div>
  )
}

export default ProjectsPage
