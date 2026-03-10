const { chromium } = require('playwright');
const fs = require('fs');

const concepts = [
    ...[
        {
            "title": "Unit Vector",
            "content": "A unit vector is a vector with a magnitude of 1, often used to indicate direction. It is found by dividing a vector by its magnitude.\n\n$$\\hat{A} = \\frac{\\vec{A}}{|\\vec{A}|} = \\frac{A_x\\hat{i} + A_y\\hat{j} + A_z\\hat{k}}{\\sqrt{A_x^2 + A_y^2 + A_z^2}}$$"
        },
        {
            "title": "Vector Dot Product",
            "content": "The dot product (scalar product) represents the projection of one vector onto another. If the dot product is zero, the vectors are orthogonal (perpendicular).\n\n$$\\vec{A} \\cdot \\vec{B} = |\\vec{A}||\\vec{B}|\\cos\\theta = A_x B_x + A_y B_y + A_z B_z$$"
        },
        {
            "title": "Vector Cross Product",
            "content": "The cross product results in a vector that is perpendicular to the plane formed by the two input vectors. If the cross product is zero, the vectors are parallel.\n\n$$|\\vec{A} \\times \\vec{B}| = |\\vec{A}||\\vec{B}|\\sin\\theta$$\n\n$$\\vec{A} \\times \\vec{B} = \\begin{vmatrix} \\hat{i} & \\hat{j} & \\hat{k} \\\\ A_x & A_y & A_z \\\\ B_x & B_y & B_z \\end{vmatrix}$$"
        },
        {
            "title": "Polar Coordinates (2D)",
            "content": "A two-dimensional coordinate system where each point is determined by a distance from a reference point ($r$) and an angle from a reference direction ($\\theta$).\n\n- **Radius:** $r = \\sqrt{x^2 + y^2}$\n- **Angle:** $\\theta = \\arctan(y/x)$\n\nUnit vector definitions:\n\n$$\\hat{r} = \\cos\\theta\\hat{x} + \\sin\\theta\\hat{y}$$\n$$\\hat{\\theta} = -\\sin\\theta\\hat{x} + \\cos\\theta\\hat{y}$$"
        },
        {
            "title": "Circular Motion Kinematics",
            "content": "In circular motion, the radius $R$ is constant ($\\dot{r} = 0$). The acceleration has two components: centripetal (inward) and tangential.\n\n**Velocity:**\n$$\\vec{v} = R\\omega \\hat{\\theta}$$\n\n**Acceleration:**\n$$\\vec{a} = -R\\omega^2 \\hat{r} + R\\alpha \\hat{\\theta}$$\n\nWhere angular velocity $\\omega = \\dot{\\theta}$ and angular acceleration $\\alpha = \\ddot{\\theta}$."
        },
        {
            "title": "Newton's First Law (Inertia)",
            "content": "An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced external force.\n\n$$\\sum \\vec{F} = 0 \\iff \\vec{v} = \\text{const}$$"
        },
        {
            "title": "Newton's Second Law",
            "content": "The rate of change of momentum of a body is directly proportional to the applied force and takes place in the direction in which the force acts.\n\n$$\\sum \\vec{F} = \\frac{d\\vec{p}}{dt} = m\\vec{a}$$\n\n*(Assuming mass $m$ is constant)*"
        },
        {
            "title": "Newton's Third Law (Action-Reaction)",
            "content": "For every action, there is an equal and opposite reaction.\n\n$$\\vec{F}_{12} = -\\vec{F}_{21}$$"
        },
        {
            "title": "Kinetic Friction",
            "content": "The resistive force between two moving surfaces in contact. It is proportional to the normal force $N$.\n\n$$f_k = \\mu_k N$$"
        },
        {
            "title": "Static Friction",
            "content": "The resistive force between two surfaces in contact that are not moving relative to each other. It must be overcome to initiate motion.\n\n$$f_s \\le \\mu_s N$$"
        },
        {
            "title": "Viscous Drag (Stokes' Law)",
            "content": "The resistive force on a small object moving through a fluid at a relatively low speed.\n\n$$\\vec{f}_d = -b\\vec{v}$$\n\n*(Where $b = 6\\pi\\eta r$ for a sphere)*"
        },
        {
            "title": "Work (Constant Force)",
            "content": "The energy transferred to or from an object via the application of force along a displacement.\n\n$$W = \\vec{F} \\cdot \\Delta\\vec{r} = |\\vec{F}||\\Delta\\vec{r}|\\cos\\theta$$"
        },
        {
            "title": "Work (Variable Force)",
            "content": "The integral of force over displacement.\n\n$$W = \\int_{\\vec{r}_1}^{\\vec{r}_2} \\vec{F} \\cdot d\\vec{r}$$"
        },
        {
            "title": "Work-Energy Theorem",
            "content": "The net work done on an object equals the change in its kinetic energy.\n\n$$W_{net} = \\Delta K = K_f - K_i$$\n\nWhere Kinetic Energy $K = \\frac{1}{2}mv^2$."
        },
        {
            "title": "Conservative Force",
            "content": "A force for which the work done is independent of the path taken, only depending on the initial and final positions. Equivalently, the work done over a closed path is zero.\n\n$$\\oint \\vec{F}_c \\cdot d\\vec{r} = 0$$\n\nA conservative force can be expressed as the negative gradient of a potential energy $U$:\n\n$$\\vec{F}_c = -\\nabla U$$\n\n*(Note: $\\nabla \\times \\vec{F}_c = 0$ is a necessary condition)*"
        },
        {
            "title": "Mechanical Energy Conservation",
            "content": "If only conservative forces act on an object, its total mechanical energy (kinetic + potential) remains constant.\n\n$$E = K + U = \\text{const}$$\n\nIf non-conservative forces (like friction) do work, then $\\Delta E = W_{nc}$."
        },
        {
            "title": "Power",
            "content": "The rate at which work is done or energy is transferred.\n\n$$P = \\frac{dW}{dt} = \\vec{F} \\cdot \\vec{v}$$"
        },
        {
            "title": "Center of Mass (Discrete)",
            "content": "The unique point where the weighted relative position of the distributed mass sums to zero.\n\n$$\\vec{R}_{cm} = \\frac{\\sum m_i \\vec{r}_i}{M_{total}}$$"
        },
        {
            "title": "Center of Mass (Continuous)",
            "content": "The integral analog for the center of mass of a continuous body.\n\n$$\\vec{R}_{cm} = \\frac{1}{M} \\int \\vec{r} \\, dm$$\n\nWhere $dm = \\rho \\, dV$ (or $\\sigma \\, dA$, or $\\lambda \\, dx$)."
        },
        {
            "title": "Momentum Conservation",
            "content": "If the net external force on a system is zero, the total momentum of the system is conserved.\n\n$$\\sum \\vec{F}_{ext} = 0 \\implies \\vec{P} = \\text{const}$$"
        },
        {
            "title": "Impulse",
            "content": "The integral of a force over the time interval for which it acts. It equals the change in momentum.\n\n$$\\vec{J} = \\int \\vec{F} \\, dt = \\Delta\\vec{p}$$"
        },
        {
            "title": "Elastic Collision",
            "content": "A collision in which both total momentum and total kinetic energy are conserved.\n\n$$e = -\\frac{v_{2f} - v_{1f}}{v_{2i} - v_{1i}} = 1$$\n\nWhere $e$ is the coefficient of restitution."
        },
        {
            "title": "Inelastic Collision",
            "content": "A collision where momentum is conserved, but kinetic energy is not (some is lost to heat, deformation, etc.).\n\n- **Inelastic:** $0 < e < 1$\n- **Perfectly Inelastic:** $e = 0$ (the objects stick together)"
        },
        {
            "title": "Angular Velocity Vector",
            "content": "A vector whose magnitude is the rate of rotation ($\\omega$) and whose direction is given by the right-hand rule along the axis of rotation.\n\n$$\\vec{v} = \\vec{\\omega} \\times \\vec{r}$$"
        },
        {
            "title": "Angular Momentum (Particle)",
            "content": "The rotational analog of linear momentum for a point particle, defined relative to an origin.\n\n$$\\vec{L} = \\vec{r} \\times \\vec{p} = \\vec{r} \\times (m\\vec{v})$$"
        },
        {
            "title": "Torque",
            "content": "The rotational analog of force. It measures the effectiveness of a force in producing rotation about an axis.\n\n$$\\vec{\\tau} = \\vec{r} \\times \\vec{F}$$\n\nNewton's Second Law for Rotation:\n\n$$\\sum \\vec{\\tau} = \\frac{d\\vec{L}}{dt}$$"
        },
        {
            "title": "Moment of Inertia",
            "content": "The rotational equivalent of mass, determining the torque needed for a desired angular acceleration about a rotational axis.\n\n- **Discrete:** $I = \\sum m_i r_i^2$\n- **Continuous:** $I = \\int r^2 \\, dm$\n\nWhere $r$ is the perpendicular distance to the axis."
        },
        {
            "title": "Parallel Axis Theorem",
            "content": "Relates the moment of inertia about any axis to the moment of inertia about a parallel axis through the center of mass.\n\n$$I = I_{cm} + Md^2$$\n\nWhere $M$ is total mass and $d$ is the perpendicular distance between axes."
        },
        {
            "title": "Rotational Kinetic Energy",
            "content": "The kinetic energy due to the rotation of an object.\n\n$$K_{rot} = \\frac{1}{2}I\\omega^2$$"
        },
        {
            "title": "Work-Energy in Rotation",
            "content": "The rotational analog of the work-energy theorem.\n\n$$W = \\int \\tau \\, d\\theta$$\n$$P = \\tau \\cdot \\omega$$"
        },
        {
            "title": "Rolling Without Slipping",
            "content": "A condition where the point of contact between a rolling body and the surface is instantaneously at rest relative to the surface.\n\n$$v_{cm} = \\omega R$$\n$$a_{cm} = \\alpha R$$\n\nFriction does no work in ideal rolling without slipping."
        },
        {
            "title": "Angular Momentum Conservation",
            "content": "If the net external torque on a system is zero, its total angular momentum is conserved.\n\n$$\\sum \\vec{\\tau}_{ext} = 0 \\implies \\vec{L} = \\text{const}$$\n\nFor a rigid body: $I_i\\omega_i = I_f\\omega_f$."
        },
        {
            "title": "Gravitational Force (Newton)",
            "content": "The attractive force between two point masses.\n\n$$\\vec{F}_g = -G\\frac{m_1 m_2}{r^2}\\hat{r}$$\n\nWhere $G$ is the gravitational constant."
        },
        {
            "title": "Gravitational Potential Energy",
            "content": "The potential energy associated with the gravitational force. Standard convention sets $U=0$ at $r \\to \\infty$.\n\n$$U_g = -G\\frac{m_1 m_2}{r}$$"
        },
        {
            "title": "Simple Harmonic Motion (SHM)",
            "content": "Motion where the restoring force is directly proportional to the displacement and acts in the direction opposite to that of displacement.\n\n$$F = -kx \\implies m\\ddot{x} + kx = 0$$\n\nSolution: $x(t) = A\\cos(\\omega_0 t + \\phi)$\nWhere $\\omega_0 = \\sqrt{k/m}$."
        },
        {
            "title": "Pendulum (Simple)",
            "content": "A mass on a string (small angle approximation \\(\\sin\\theta \\approx \\theta\\)).\n\n$$\\ddot{\\theta} + \\frac{g}{L}\\theta = 0$$\n$$\\omega_0 = \\sqrt{\\frac{g}{L}}$$"
        },
        {
            "title": "Damped Harmonic Motion",
            "content": "Oscillatory motion with a resistive force proportional to velocity ($F_{drag} = -bv$).\n\n$$m\\ddot{x} + b\\dot{x} + kx = 0$$\n$$\\ddot{x} + \\gamma\\dot{x} + \\omega_0^2 x = 0$$\n\nWhere $\\gamma = b/m$. Solutions behave differently based on damping (underdamped, critically damped, overdamped)."
        },
        {
            "title": "Driven Harmonic Motion & Resonance",
            "content": "An oscillator subject to a periodic external force $F_0 \\cos(\\omega t)$.\n\n$$\\ddot{x} + \\gamma\\dot{x} + \\omega_0^2 x = \\frac{F_0}{m}\\cos(\\omega t)$$\n\n**Resonance** occurs when the driving frequency $\\omega$ matches the natural frequency $\\omega_0$, resulting in maximum amplitude."
        }
    ]
];

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

(async () => {
    // We don't know if the dev server is running on 3000, 
    // so we'll just interact with LocalStorage by visiting about:blank
    // Unfortunately, LocalStorage is origin-specific. 
    // We MUST visit localhost:3000 to write to its LocalStorage.
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

        await page.evaluate((conceptsToInsert) => {
            // Read existing data
            const dataStr = window.localStorage.getItem('knowledge_data');
            let data = dataStr ? JSON.parse(dataStr) : { items: [], topics: [] };

            // Generate UUID
            function generateUUID() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }

            // Find or create 'Physics' topic
            let physicsTopic = data.topics.find((t) => t.name.toLowerCase() === 'physics');
            if (!physicsTopic) {
                physicsTopic = {
                    id: generateUUID(),
                    name: "Physics",
                    color: "#3b82f6", // Blue
                    createdAt: Date.now()
                };
                data.topics.push(physicsTopic);
            }

            const now = Date.now();
            let addedCount = 0;

            // Add concepts
            conceptsToInsert.forEach((c) => {
                // Prevent exactly duplicate titles
                if (!data.items.find((item) => item.title === c.title)) {
                    data.items.push({
                        id: generateUUID(),
                        type: 'concept',
                        title: c.title,
                        content: c.content,
                        topicIds: [physicsTopic.id],
                        interval: 0,
                        repetition: 0,
                        efactor: 2.5,
                        nextReviewDate: now,
                        lastGrade: undefined,
                        createdAt: now,
                        updatedAt: now
                    });
                    addedCount++;
                }
            });

            window.localStorage.setItem('knowledge_data', JSON.stringify(data));
            console.log(`Successfully added ${addedCount} physics concepts to LocalStorage!`);
        }, concepts);

        console.log("Playwright script execution complete.");
    } catch (e) {
        console.error("Error running Playwright:", e);
    } finally {
        await browser.close();
    }
})();
