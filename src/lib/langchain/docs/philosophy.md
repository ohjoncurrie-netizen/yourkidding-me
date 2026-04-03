# Engineering Philosophy — Jon Currie

## On databases
- PostgreSQL first, always. The marginal cost of learning SQL properly is zero compared to the cost
of fighting eventual consistency when your data is financial or relational.
I reach for NoSQL when the access pattern is genuinely document-shaped and I know it upfront —
not as a default because someone said SQL doesn't scale (it does, at any scale I've ever needed).

## On frameworks
- Next.js is the right default for React apps in 2024-2025. SSR matters for SEO and first load.
The App Router is genuinely better than Pages Router once you internalize server vs client components.
I don't use Create React App for anything new.

## On security
- Security isn't a feature you add at the end. Input validation belongs at the boundary. I never store plaintext secrets, never trust client-provided IDs for authorization, always verify webhook signatures, and never use eval or innerHTML with user data.

Principle: Least Privilege. Whether it's database roles or file permissions on a Linux server, everything should only have the access it absolutely needs to function.

## On complexity
- I don't build what I don't need. No microservices for a side project.
No message queues until I have a specific async problem.
The right amount of complexity is the minimum required for the actual problem.

## On testing
- I’m a "ship and watch the logs" developer for the MVP, but I transition to integration tests for critical paths. If the payment flow or the scraper’s main parser breaks, the project is dead. I prioritize testing the "happy path" and the most catastrophic failure points over 100% unit test coverage.

## On shipping
- Done is better than perfect, but "done" must be functional. I believe in launching an MVP to see if a community actually wants the tool (like with the Montana Blotter) before spending months on micro-optimizations. I’d rather have a working tool with a basic UI than a beautiful site that doesn’t solve the user's problem.

## On learning
- I learn by breaking things. Documentation is the map, but the source code is the terrain. When I wanted to understand Linux systems better, I switched to Kali as a daily driver for development—nothing teaches you networking and permissions faster than having to manually configure your own environment from the terminal.

## Opinions I'll defend
- TypeScript strict mode from day one: Retrofitting types is a nightmare that costs 3x the time of just doing it right initially.

- Tailwind CSS is good, actually: Speed of development and consistency across a project outweigh the "ugly" HTML.

- ORMs hide too much for anything beyond CRUD: I write raw SQL for non-trivial queries. If I'm doing a complex join or a full-text search index in Postgres, I want to see exactly what’s happening.

- Public Data should be Public: If a government agency puts records behind a convoluted UI, it's a developer's job to normalize it and give it back to the people.
## What I'm bad at
- Visual Design. I can build a functional, responsive, and secure application all day, but I don’t have the "eye" for color theory or original layout design. I rely heavily on robust CSS frameworks and design systems to make sure my projects don't look like they were built in 1998.
