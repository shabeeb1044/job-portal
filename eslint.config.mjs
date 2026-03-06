import nextCoreWebVitals from "eslint-config-next/core-web-vitals"

// Base on Next.js core-web-vitals rules but relax a few project-specific constraints.
const config = [
  ...nextCoreWebVitals,
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]

export default config
