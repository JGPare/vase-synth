
default_vase = {
    "generic0" : {
        "height" : 60,
        "width" : 20,
        "thickness" : 10,
     },

     "generic1" : {
        "radial_steps" : 50,
        "vertical_steps" : 50,
        "slope"  : 50,
     },

    "modifiers" : [
        { "type" : "sin_radial",
        "mag" : 0,
        "freq" : 10,
        "twist" : 0,
        "phase" : 0,
        },
        { "type" : "sin_vertical",
        "mag" : 0,
        "freq" : 10,
        "phase" : 0,
        }
        ]
}

settings = {
    "width" : {
        "min" : 5,
        "max" : 55,
        "step" : 1,
        },
    "height" : {
        "min" : 10,
        "max" : 100,
        "step" : 1,
        },
    "thickness" : {
        "min" : 1,
        "max" : 100,
        "step" : 1,
        },
    "slope" : {
        "min" : 0,
        "max" : 100,
        "step" : 1,
        },
    "vertical_steps" : {
        "min" : 3,
        "max" : 150,
        "step" : 1,
        },
    "radial_steps" : {
        "min" : 4,
        "max" : 150,
        "step" : 1,
        },
    "radial_mag" : {
        "min" : 0,
        "max" : 100,
        "step" : 1,
        },
    "radial_freq" : {
        "min" : 0,
        "max" : 50,
        "step" : 1,
        },
    "radial_twist" : {
        "min" : -80,
        "max" : 80,
        "step" : 1,
        },
    "radial_phase" : {
        "min" : 0,
        "max" : 100,
        "step" : 1,
        },
    "vertical_mag" : {
        "min" : 0,
        "max" : 100,
        "step" : 1,
        },
    "vertical_freq" : {
        "min" : 0,
        "max" : 100,
        "step" : 1,
        },
    "vertical_phase" : {
        "min" : 0,
        "max" : 100,
        "step" : 1,
        },
    "tri_radial_mag" : {
        "min" : 0,
        "max" : 100,
        "step" : 1,
        },
    "tri_radial_freq" : {
        "min" : 0,
        "max" : 50,
        "step" : 1,
        },
    "tri_radial_twist" : {
        "min" : -80,
        "max" : 80,
        "step" : 1,
        },
    "tri_radial_phase" : {
        "min" : 0,
        "max" : 100,
        "step" : 1,
        },
    "tri_vertical_mag" : {
        "min" : 0,
        "max" : 100,
        "step" : 1,
        },
    "tri_vertical_freq" : {
        "min" : 0,
        "max" : 100,
        "step" : 1,
        },
    "tri_vertical_phase" : {
        "min" : 0,
        "max" : 100,
        "step" : 1,
        },
    "julia_mag" : {
        "min" : 0,
        "max" : 100,
        "step" : 1,
        },
    "julia_c_x" : {
        "min" : -150,
        "max" : 150,
        "step" : 1,
        },
    "julia_c_y" : {
        "min" : -150,
        "max" : 150,
        "step" : 1,
        },
    "julia_r_sample" : {
        "min" : 10,
        "max" : 200,
        "step" : 1,
        },
    "julia_iterations" : {
        "min" : 5,
        "max" : 100,
        "step" : 1,
        },
    "julia_freq" : {
        "min" : 1,
        "max" : 20,
        "step" : 1,
        },
    "julia_phase" : {
        "min" : 0,
        "max" : 100,
        "step" : 1,
        },
    "julia_rotate_c" : {
        "min" : -100,
        "max" : 100,
        "step" : 1,
        },
}
