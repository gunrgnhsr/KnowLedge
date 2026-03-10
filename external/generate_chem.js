const fs = require('fs');

const concepts = [
    {
        title: "Molecular Structures (VSEPR)",
        content: `
-  **Linear**: $AX_2$

\\\\begin{tikzpicture}[scale=0.4]
\\\\draw[thick] (0,0) -- (2,0);
\\\\draw[thick] (0,0) -- (-2,0);
\\\\fill[blue!70!black] (0,0) circle (0.4);
\\\\fill[gray!80] (2,0) circle (0.4);
\\\\fill[gray!80] (-2,0) circle (0.4);
\\\\end{tikzpicture}

-  **Trigonal Planar**: $AX_3$

\\\\begin{tikzpicture}[scale=0.4]
\\\\draw[thick] (0,0) -- (0,2);
\\\\draw[thick] (0,0) -- (1.73,-1);
\\\\draw[thick] (0,0) -- (-1.73,-1);
\\\\fill[blue!70!black] (0,0) circle (0.4);
\\\\fill[gray!80] (0,2) circle (0.4);
\\\\fill[gray!80] (1.73,-1) circle (0.4);
\\\\fill[gray!80] (-1.73,-1) circle (0.4);
\\\\end{tikzpicture}

-  **Tetrahedral**: $AX_4$

\\\\begin{tikzpicture}[scale=0.4]
\\\\draw[thick] (0,0) -- (0,2);
\\\\draw[thick] (0,0) -- (1.88,-0.66);
\\\\draw[thick] (0,0) -- (-1.88,-0.66);
\\\\draw[thick, dashed] (0,0) -- (0,-1);
\\\\fill[blue!70!black] (0,0) circle (0.4);
\\\\fill[gray!80] (0,2) circle (0.4);
\\\\fill[gray!80] (1.88,-0.66) circle (0.4);
\\\\fill[gray!80] (-1.88,-0.66) circle (0.4);
\\\\fill[gray!80] (0,-1) circle (0.4);
\\\\end{tikzpicture}

-  **Trigonal Bipyramidal**: $AX_5$

\\\\begin{tikzpicture}[scale=0.4]
\\\\draw[thick] (0,0) -- (0,2.5);
\\\\draw[thick] (0,0) -- (0,-2.5);
\\\\draw[thick] (0,0) -- (2,-0.5);
\\\\draw[thick] (0,0) -- (-2,-0.5);
\\\\draw[thick, dashed] (0,0) -- (0,0.8);
\\\\fill[blue!70!black] (0,0) circle (0.4);
\\\\fill[gray!80] (0,2.5) circle (0.4);
\\\\fill[gray!80] (0,-2.5) circle (0.4);
\\\\fill[gray!80] (2,-0.5) circle (0.4);
\\\\fill[gray!80] (-2,-0.5) circle (0.4);
\\\\fill[gray!80] (0,0.8) circle (0.4);
\\\\end{tikzpicture}

-  **Octahedral**: $AX_6$

\\\\begin{tikzpicture}[scale=0.4]
\\\\draw[thick] (0,0) -- (0,2.5);
\\\\draw[thick] (0,0) -- (0,-2.5);
\\\\draw[thick] (0,0) -- (2,0);
\\\\draw[thick] (0,0) -- (-2,0);
\\\\draw[thick] (0,0) -- (1.2,1.2);
\\\\draw[thick, dashed] (0,0) -- (-1.2,-1.2);
\\\\fill[blue!70!black] (0,0) circle (0.4);
\\\\fill[gray!80] (0,2.5) circle (0.4);
\\\\fill[gray!80] (0,-2.5) circle (0.4);
\\\\fill[gray!80] (2,0) circle (0.4);
\\\\fill[gray!80] (-2,0) circle (0.4);
\\\\fill[gray!80] (1.2,1.2) circle (0.4);
\\\\fill[gray!80] (-1.2,-1.2) circle (0.4);
\\\\end{tikzpicture}
`.trim()
    },
    {
        title: "The Kinetic Model",
        content: `
-  **Kinetic Energy**: $E_k = \\frac{1}{2}mv^2$
-  **Maxwell-Boltzmann Distribution**: 

$$
f(v) = 4\\pi\\left(\\frac{m}{2\\pi k_B T}\\right)^{3/2} v^2 \\exp\\left(-\\frac{mv^2}{2k_B T}\\right)
$$

-  **Root-Mean-Square Speed ($v_{rms}$)**: $v_{rms} = \\sqrt{\\overline{v^2}} = \\sqrt{\\frac{3k_B T}{m}}$
-  **Average Speed ($\\bar{v}$)**: $\\bar{v} = \\sqrt{\\frac{8k_B T}{\\pi m}}$
-  **Most Probable Speed ($v_m$)**: $v_m = \\sqrt{\\frac{2k_B T}{m}}$
-  **Effusion Rate ($r$)**: $r \\propto \\sqrt{\\frac{T}{m}}$
-  **Isotope Enrichment**: $\\left(\\frac{C_{light}}{C_{heavy}}\\right)_f = \\left(\\frac{C_{light}}{C_{heavy}}\\right)_i \\cdot \\alpha^n$, where $\\alpha = \\frac{r_{light}}{r_{heavy}}$
`.trim()
    },
    {
        title: "Electromagnetic Radiation & Atomic Structure",
        content: `
-  **Energy of a Photon**: $E = h\\nu = \\frac{hc}{\\lambda}$ (where $\\nu$ is frequency, $\\lambda$ is wavelength)
-  **Bohr Radius**: 

$$
r_n = \\frac{h^2}{4\\pi^2 m_e k_e e^2 Z} n^2 = \\frac{a_0 n^2}{Z}
$$

	-  $Z$ = nuclear charge, $m_e$ = electron mass, $k_e$ = Coulomb's constant, $a_0 \\approx 53\\text{pm}$

-  **Energy Levels (single-electron atom)**: $E_n = -R_H Z^2 \\left(\\frac{1}{n^2}\\right)$ (where $R_H$ is the Rydberg constant)
-  **De Broglie Wavelength**: $\\lambda = \\frac{h}{mv} = \\frac{h}{p}$
-  **Photoelectric Effect**: $E_{ph} = \\Phi + E_{k,e}$ (where $\\Phi$ is the work function)
-  **Angular Momentum Notation**: $l=0\\,(s), l=1\\,(p), l=2\\,(d), l=3\\,(f), l=4\\,(g)$
-  **Rydberg Constant Relation**: $R_H = \\frac{1}{2} k_e e^2 / a_0$
`.trim()
    },
    {
        title: "Gases",
        content: `
-  **Ideal Gas Law**: $PV = nRT$
-  **Van der Waals equation (non-ideal gases)**: 

$$
P = \\frac{nRT}{V - nb} - a\\left(\\frac{n}{V}\\right)^2
$$

-  **Compressibility Factor ($Z$)**: $Z = \\frac{P\\bar{V}}{RT} = \\frac{PV}{nRT}$
-  **Dalton's Law of Partial Pressures**: $P_{tot} = P_A + P_B + \\dots$ (where $P_A = \\frac{n_A RT}{V}$)
`.trim()
    },
    {
        title: "Liquids",
        content: `
-  **Hydrostatic Pressure**: $P = d \\cdot g \\cdot h$ (density $d$ and height $h$)
-  **Viscosity (Ostwald Viscometer)**: $\\frac{\\eta_1}{\\eta_2} = \\frac{\\rho_1 t_1}{\\rho_2 t_2}$
-  **Viscosity (Falling-Sphere Viscometer)**: $\\eta = \\frac{2r_b^2 (d_b - d)g}{9v_{max}}$
-  **Capillary Action (Fluid Height)**: 

$$
h = \\frac{2\\gamma \\cos\\theta}{d g r}
$$

	-  $\\gamma$ = surface tension, $r$ = tube radius
`.trim()
    },
    {
        title: "Thermochemistry and Thermodynamics",
        content: `
-  **0th Law**: Two systems in thermal equilibrium have the same temperature.
-  **1st Law**: $\\Delta U = q + w$. For gas under constant external pressure: $w = -P_{ext}\\Delta V$
-  **2nd Law**: In a spontaneous process, $\\Delta S_{universe} \\ge 0$
-  **3rd Law**: $S(T=0\\text{ K}) = 0$
-  **Heat & Heat Capacity**: $q = C\\Delta T = mc_p\\Delta T = n\\bar{C}\\Delta T$
-  **Heat in an Isothermal Process**: $q = nRT \\ln\\left(\\frac{V_2}{V_1}\\right)$
-  **Enthalpy ($H$)**: At constant pressure: $\\Delta H = \\Delta U + P\\Delta V$
-  **Standard Enthalpy of Reaction**: 

$$
\\Delta H_{rxn}^\\circ = \\sum n_p \\Delta H_f^\\circ(p) - \\sum n_r \\Delta H_f^\\circ(r)
$$
`.trim()
    },
    {
        title: "Equilibrium & Free Energy",
        content: `
-  **Equilibrium Constant ($K_{eq}$)**: $\\ln K_{eq} = -\\frac{\\Delta G^\\circ}{RT}$
-  **Van 't Hoff Equation**: 

$$
\\ln\\left(\\frac{K_2}{K_1}\\right) = -\\frac{\\Delta H^\\circ}{R}\\left(\\frac{1}{T_2} - \\frac{1}{T_1}\\right)
$$

-  **Entropy of Reaction**: $\\Delta S_{rxn} = \\sum n_p S(p) - \\sum n_r S(r)$
-  **Entropy of Surroundings**: $\\Delta S_{surr} = -\\frac{\\Delta H_{sys}}{T}$
-  **Entropy Change Explicit Formulae**:
	-  Isothermal Process: $\\Delta S_{sys} = nR \\ln\\left(\\frac{V_2}{V_1}\\right)$
	-  Isochoric/Isobaric Process: $\\Delta S_{sys} = nC_{v/p} \\ln\\left(\\frac{T_2}{T_1}\\right)$
-  **Gibbs Free Energy**: $\\Delta G = \\Delta H - T\\Delta S$
-  **Standard Free Energy of Reaction**: $\\Delta G_{rxn}^\\circ = \\sum n_p \\Delta G_f^\\circ(p) - \\sum n_r \\Delta G_f^\\circ(r)$
-  **Non-standard Free Energy**: $\\Delta G = \\Delta G^\\circ + RT \\ln Q$ (where $Q$ is the reaction quotient)
`.trim()
    },
    {
        title: "Vapor Pressure",
        content: `
-  **Clausius-Clapeyron Equation**: 

$$
\\ln\\left(\\frac{P_2}{P_1}\\right) = -\\frac{\\Delta H_{vap}}{R}\\left(\\frac{1}{T_2} - \\frac{1}{T_1}\\right)
$$

-  **Relative Humidity (RH)**: $RH = \\frac{P_{H_2O}}{P_{H_2O}^\\circ} \\times 100\\%$
`.trim()
    },
    {
        title: "Colligative Properties",
        content: `
-  **Raoult's Law**: $P_a = x_a P_a^\\circ \\quad \\left(x_a = \\frac{n_a}{\\sum n_i}\\right)$
-  **Henry's Law**: $C_i = k_{H_i} \\times P_i$
-  **Boiling Point Elevation**: $\\Delta T_b = i K_b m_c$ (For water, $K_b = 0.512\\,^\\circ\\text{C/m}$)
-  **Freezing Point Depression**: $\\Delta T_f = -i K_f m_c$ (For water, $K_f = 1.86\\,^\\circ\\text{C/m}$)
-  **Osmotic Pressure**: $\\Pi = i \\frac{n}{V} RT = i M_c RT$
`.trim()
    },
    {
        title: "Solids",
        content: `
-  **Bragg's Law**: $n\\lambda = 2d \\sin\\theta$
-  **Crystal Lattice Holes (Radius Ratio $r/R$)**:

	-  **Tetrahedral Hole** ($0.225 - 0.414$):
	
	\\\\begin{tikzpicture}[scale=0.5]
	\\\\draw[thick] (0,0) -- (0,2);
	\\\\draw[thick] (0,0) -- (1.88,-0.66);
	\\\\draw[thick] (0,0) -- (-1.88,-0.66);
	\\\\draw[thick, dashed] (0,0) -- (0,-1);
	\\\\fill[gray!80] (0,2) circle (0.5);
	\\\\fill[gray!80] (1.88,-0.66) circle (0.5);
	\\\\fill[gray!80] (-1.88,-0.66) circle (0.5);
	\\\\fill[gray!80] (0,-1) circle (0.5);
	\\\\fill[red!70!black] (0,0) circle (0.3);
	\\\\end{tikzpicture}

	-  **Octahedral Hole** ($0.414 - 0.732$):
	
	\\\\begin{tikzpicture}[scale=0.5]
	\\\\draw[thick] (0,0) -- (0,2);
	\\\\draw[thick] (0,0) -- (0,-2);
	\\\\draw[thick] (0,0) -- (2,0);
	\\\\draw[thick] (0,0) -- (-2,0);
	\\\\draw[thick] (0,0) -- (1.1,1.1);
	\\\\draw[thick, dashed] (0,0) -- (-1.1,-1.1);
	\\\\fill[gray!80] (0,2) circle (0.5);
	\\\\fill[gray!80] (0,-2) circle (0.5);
	\\\\fill[gray!80] (2,0) circle (0.5);
	\\\\fill[gray!80] (-2,0) circle (0.5);
	\\\\fill[gray!80] (1.1,1.1) circle (0.5);
	\\\\fill[gray!80] (-1.1,-1.1) circle (0.5);
	\\\\fill[red!70!black] (0,0) circle (0.3);
	\\\\end{tikzpicture}

	-  **Cubic Hole** ($>0.732$):
	
	\\\\begin{tikzpicture}[scale=0.5]
	\\\\draw[thick, dashed] (-1.5,-1.5) -- (1.5,-1.5) -- (1.5,1.5) -- (-1.5,1.5) -- cycle;
	\\\\draw[thick, dashed] (-1.5,-1.5) -- (-2.2,-2.2);
	\\\\draw[thick] (1.5,-1.5) -- (0.8,-2.2);
	\\\\draw[thick] (1.5,1.5) -- (0.8,0.8);
	\\\\draw[thick] (-1.5,1.5) -- (-2.2,0.8);
	\\\\draw[thick] (-2.2,-2.2) -- (0.8,-2.2) -- (0.8,0.8) -- (-2.2,0.8) -- cycle;
	\\\\draw[thick, dashed] (-0.35,-0.35) -- (-1.5,-1.5);
	\\\\draw[thick, dashed] (-0.35,-0.35) -- (1.5,-1.5);
	\\\\draw[thick, dashed] (-0.35,-0.35) -- (1.5,1.5);
	\\\\draw[thick, dashed] (-0.35,-0.35) -- (-1.5,1.5);
	\\\\draw[thick] (-0.35,-0.35) -- (-2.2,-2.2);
	\\\\draw[thick] (-0.35,-0.35) -- (0.8,-2.2);
	\\\\draw[thick] (-0.35,-0.35) -- (0.8,0.8);
	\\\\draw[thick] (-0.35,-0.35) -- (-2.2,0.8);
	\\\\fill[gray!80] (-1.5,-1.5) circle (0.4);
	\\\\fill[gray!80] (1.5,-1.5) circle (0.4);
	\\\\fill[gray!80] (1.5,1.5) circle (0.4);
	\\\\fill[gray!80] (-1.5,1.5) circle (0.4);
	\\\\fill[red!70!black] (-0.35,-0.35) circle (0.3);
	\\\\fill[gray!80] (-2.2,-2.2) circle (0.4);
	\\\\fill[gray!80] (0.8,-2.2) circle (0.4);
	\\\\fill[gray!80] (0.8,0.8) circle (0.4);
	\\\\fill[gray!80] (-2.2,0.8) circle (0.4);
	\\\\end{tikzpicture}
`.trim()
    },
    {
        title: "Nuclear Radiation",
        content: `
-  **Basic Types of Decay**:
	-  **Alpha ($\\alpha$) Decay**: Emission of a Helium nucleus ($ ^{4}_{2}\\text{He} $). Reduces atomic number by 2 and mass number by 4.
	-  **Beta ($\\beta^-$) Decay**: Emission of an electron ($ ^{0}_{-1}\\text{e} $). Increases atomic number by 1, mass number unchanged.
	-  **Positron ($\\beta^+$) Decay**: Emission of a positron ($ ^{0}_{+1}\\text{e} $). Decreases atomic number by 1, mass number unchanged.
	-  **Gamma ($\\gamma$) Decay**: Emission of high-energy photon. No change in mass or atomic number.

-  **Kinetics of Radioactive Decay**:
	-  **Decay Rate Law (First-Order)**: $N(t) = N_0 e^{-\\lambda t}$ (where $\\lambda$ is the decay constant, $N_0$ is initial quantity).
	-  **Activity (A)**: $A = -\\frac{dN}{dt} = \\lambda N$.
	-  **Half-Life ($t_{1/2}$)**: $t_{1/2} = \\frac{\\ln(2)}{\\lambda} \\approx \\frac{0.693}{\\lambda}$.

-  **Mass-Energy Equivalence**:
	-  **Mass Defect ($\\Delta m$)**: The difference between the mass of an isotope and its constituent protons and neutrons. $\\Delta m = (Z \\cdot m_p + N \\cdot m_n) - M_{nucleus}$
	-  **Nuclear Binding Energy ($E_b$)**: The energy required to split a nucleus into its component nucleons. $E_b = \\Delta m \\cdot c^2$ (where $c$ is the speed of light).
`.trim()
    }
];

let output = JSON.stringify({ concepts: concepts }, null, 2);

// Single backslashes for custom parser & true newlines
output = output.replace(/\\\\\\\\/g, '\\\\'); // Just in case we had any double escapes mapping to 4
output = output.replace(/\\\\(?=[^trbn"\\/])/g, '\\');
// Wait, the safest way to replace stringified backslashes without messing up JSON:
// In JS, `\n` is actually a newline in the string literal, so stringify turns it to `\n`
// But we want actual newlines in our JSON string text, not escaped `\\n`?
// No, standard JSON uses `\\n` for newlines within strings.
// But the application's parser uses a custom setup where the file content is somewhat raw.
// However, the user said "replace \\\\ with \\" like we did previously. Let's do exactly what we did previously:
output = output.replace(/\\\\/g, '\\\\'); // Actually previous script: output = output.replace(/\\\\/g, '\\'); // This means replace 2 backslashes with 1.
// Let's reset the logic to exactly what we wrote in parse_sections.js:
// output = output.replace(/\\\\/g, '\\');
// output = output.replace(/\\r\\n/g, '\\n');

// Wait! If output is a raw string from stringify:
// JSON.stringify will double escape: \n becomes \\n, \\ becomes \\\\
// The previous code did:
// output = output.replace(/\\\\/g, '\\');
// output = output.replace(/\\r\\n/g, '\\n');
// Let's rely on exactly that pattern to ensure compatibility.
output = output.replace(/\\\\/g, '\\');
output = output.replace(/\\r\\n/g, '\\n');

fs.writeFileSync('chem_concepts.json', output);
console.log('Successfully generated chem_concepts.json with ' + concepts.length + ' concepts.');
