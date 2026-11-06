const DEFAULT_SCENARIO = {
  "schema_version": "1.0",
  "scenario_meta": {
    "id": "icu_scenario_hypoxia_v1",
    "title": "ΜΕΘ: Διαχείριση Υποξαιμίας & Αναπνευστήρα",
    "description": "Σενάριο διαχείρισης πτώσης κορεσμού με χρήση αναπνευστήρα και υποχρεωτική ψηφιακή τεκμηρίωση.",
    "estimated_duration_minutes": 8,
    "difficulty": "Intermediate",
    "learning_goals": [
      "Αναγνώριση κλινικού συναγερμού (SpO2)",
      "Αλληλεπίδραση με hotspots (Αναπνευστήρας, Μόνιτορ)",
      "Χρήση Documentation Gates στο e-Health module",
      "Τήρηση πρωτοκόλλου κλιμάκωσης"
    ]
  },
  "initial_state": {
    "time_elapsed": 0,
    "current_score": 100,
    "flags": {
      "assessment_complete": false,
      "oxygen_adjusted": false,
      "documentation_1_complete": false,
      "escalation_complete": false,
      "documentation_2_complete": false
    },
    "vitals": {
      "hr": 110,
      "spo2": 88,
      "rr": 24,
      "bp": "125/80",
      "temp": 37.0
    },
    "ui": {
      "active_hotspots": [
        "hs_monitor",
        "hs_patient",
        "hs_ventilator",
        "hs_ehr",
        "hs_call"
      ],
      "monitor_alert": true
    }
  },
  "hotspots": [
    {
      "id": "hs_monitor",
      "label": "Μόνιτορ Ζωτικών (Monitor)"
    },
    {
      "id": "hs_patient",
      "label": "Ασθενής/Κλίνη (Patient)"
    },
    {
      "id": "hs_ventilator",
      "label": "Αναπνευστήρας (Ventilator)"
    },
    {
      "id": "hs_ehr",
      "label": "Τερματικό EHR (e-Health)"
    },
    {
      "id": "hs_call",
      "label": "Κουμπί Κλήσης (Call Button)"
    }
  ],
  "ehr_config": {
    "forms": {
      "assessment_form": {
        "title": "Κλινική Αξιολόγηση",
        "fields": [
          "observation",
          "skin_color",
          "consciousness"
        ]
      },
      "intervention_form": {
        "title": "Παρεμβάσεις / Ρυθμίσεις",
        "fields": [
          "device",
          "fiO2_setting",
          "flow_rate"
        ]
      },
      "communication_log": {
        "title": "Ημερολόγιο Επικοινωνίας",
        "fields": [
          "recipient",
          "reason",
          "outcome"
        ]
      }
    }
  },
  "rules": {
    "global_rules": [
      {
        "id": "rule_hypoxia_alarm",
        "condition": {
          "vitals.spo2": {
            "lt": 90
          }
        },
        "effects": [
          {
            "type": "ui_visual",
            "target": "hs_monitor",
            "state": "blinking_red"
          },
          {
            "type": "ui_toast",
            "style": "danger",
            "message": "ΣΥΝΑΓΕΡΜΟΣ: SpO2 < 90% (Υποξαιμία)"
          }
        ]
      }
    ]
  },
  "nodes": [
    {
      "id": "n1_start",
      "type": "message",
      "text": "Βρίσκεστε στη ΜΕΘ. Ο ασθενής στην κλίνη 1 εμφανίζει ξαφνική δύσπνοια. Το μόνιτορ χτυπάει (SpO2: 88%).",
      "next_node_id": "n2_initial_decision"
    },
    {
      "id": "n2_initial_decision",
      "type": "decision",
      "text": "Ποια είναι η πρώτη σου ενέργεια;",
      "options": [
        {
          "id": "opt_assess",
          "label": "Άμεση Αξιολόγηση Ασθενούς",
          "target_hotspot": "hs_patient",
          "effects": {
            "score_delta": 10,
            "state_update": {
              "flags.assessment_complete": true
            },
            "toast": "Παρατηρείς κυάνωση και ταχύπνοια."
          },
          "next_node_id": "n3_intervention"
        },
        {
          "id": "opt_check_monitor",
          "label": "Έλεγχος Ιστορικού στο Μόνιτορ",
          "target_hotspot": "hs_monitor",
          "effects": {
            "score_delta": 5,
            "toast": "Βλέπεις πτώση SpO2 τα τελευταία 5 λεπτά."
          },
          "next_node_id": "n3_intervention"
        }
      ],
      "timeout": {
        "seconds": 30,
        "on_timeout_effects": {
          "vitals_update": {
            "spo2": 85,
            "hr": 120
          },
          "score_delta": -10,
          "toast": "⚠️ Καθυστέρηση! Το SpO2 έπεσε στο 85%."
        },
        "next_node_id": "n3_intervention"
      }
    },
    {
      "id": "n3_intervention",
      "type": "decision",
      "text": "Το πρόβλημα είναι οξυγοναντικό. Πρέπει να ρυθμίσεις τον αναπνευστήρα.",
      "options": [
        {
          "id": "opt_increase_o2",
          "label": "Αύξηση FiO2 (100%)",
          "target_hotspot": "hs_ventilator",
          "effects": {
            "state_update": {
              "flags.oxygen_adjusted": true
            },
            "vitals_update": {
              "spo2": 94,
              "hr": 100
            },
            "score_delta": 20,
            "toast": "✅ Η ρύθμιση έγινε. Το SpO2 ανεβαίνει."
          },
          "next_node_id": "n4_gate_documentation_1"
        },
        {
          "id": "opt_do_nothing",
          "label": "Καμία αλλαγή - Αναμονή",
          "target_hotspot": "hs_patient",
          "effects": {
            "vitals_update": {
              "spo2": 80,
              "hr": 130
            },
            "score_delta": -20,
            "toast": "⛔ Κρίσιμο λάθος. Ο ασθενής αποκορεώνεται."
          },
          "next_node_id": "n4_gate_documentation_1"
        }
      ]
    },
    {
      "id": "n4_gate_documentation_1",
      "type": "gate",
      "text": "🛑 GATE: Τεκμηρίωση Αξιολόγησης & Παρέμβασης.",
      "description": "Το σύστημα μπλοκάρει τη συνέχεια μέχρι να συμπληρωθούν τα πεδία στο EHR.",
      "gate_requirements": {
        "target_hotspot": "hs_ehr",
        "required_forms": [
          {
            "form_id": "assessment_form",
            "fields": [
              "observation"
            ]
          },
          {
            "form_id": "intervention_form",
            "fields": [
              "fiO2_setting"
            ]
          }
        ]
      },
      "feedback_blocked": "⚠️ Πρέπει να συμπληρώσεις το EHR για να προχωρήσεις.",
      "feedback_success": "✅ Η τεκμηρίωση αποθηκεύτηκε.",
      "effects_on_pass": {
        "state_update": {
          "flags.documentation_1_complete": true
        },
        "score_delta": 10
      },
      "next_node_id": "n5_reassessment"
    },
    {
      "id": "n5_reassessment",
      "type": "message",
      "text": "5 λεπτά αργότερα... Η κατάσταση έχει σταθεροποιηθεί (SpO2: 94%), αλλά ο ασθενής παραμένει ταχύπνοος.",
      "next_node_id": "n6_escalation_decision"
    },
    {
      "id": "n6_escalation_decision",
      "type": "decision",
      "text": "Χρειάζεται περαιτέρω ενέργεια;",
      "options": [
        {
          "id": "opt_call_doc",
          "label": "Κλήση Ιατρού (Κλιμάκωση)",
          "target_hotspot": "hs_call",
          "effects": {
            "state_update": {
              "flags.escalation_complete": true
            },
            "score_delta": 10,
            "toast": "Έγινε κλήση στον εφημερεύοντα."
          },
          "next_node_id": "n7_gate_documentation_2"
        },
        {
          "id": "opt_wait",
          "label": "Όχι, συνεχίζω παρακολούθηση",
          "target_hotspot": "hs_monitor",
          "effects": {
            "score_delta": 0,
            "toast": "Συνεχίζεις την παρακολούθηση."
          },
          "next_node_id": "n8_end_scenario"
        }
      ]
    },
    {
      "id": "n7_gate_documentation_2",
      "type": "gate",
      "text": "🛑 GATE: Καταγραφή Επικοινωνίας.",
      "description": "Κατάγραψε την κλήση στο Communication Log.",
      "gate_requirements": {
        "target_hotspot": "hs_ehr",
        "required_forms": [
          {
            "form_id": "communication_log",
            "fields": [
              "recipient",
              "outcome"
            ]
          }
        ]
      },
      "feedback_blocked": "⚠️ Εκκρεμεί η καταγραφή της κλήσης στο EHR.",
      "feedback_success": "✅ Η επικοινωνία καταγράφηκε.",
      "effects_on_pass": {
        "state_update": {
          "flags.documentation_2_complete": true
        },
        "score_delta": 5
      },
      "next_node_id": "n8_end_scenario"
    },
    {
      "id": "n8_end_scenario",
      "type": "end",
      "text": "Το σενάριο ολοκληρώθηκε.",
      "debrief_config": {
        "show_score": true,
        "show_decision_path": true,
        "highlight_missed_docs": true,
        "export_log": true
      }
    }
  ],
  "logging": {
    "enabled": true,
    "log_events": [
      "NODE_ENTER",
      "HOTSPOT_INTERACTION",
      "OPTION_SELECTED",
      "EHR_SUBMIT",
      "VITALS_CHANGE"
    ],
    "export_format": "JSON"
  }
};

const FEVER_HYPOTENSION_SCENARIO = {
  "schema_version": "1.0",
  "scenario_meta": {
    "id": "icu_scenario_fever_hypotension_v1",
    "title": "ΜΕΘ: Πυρετός & Υπόταση - Κλιμάκωση και Τεκμηρίωση",
    "description": "Δεύτερο rule-based σενάριο που ελέγχει την επεκτασιμότητα της εφαρμογής με διαφορετικά ζωτικά, διαφορετική κλινική ροή και νέα required fields στο EHR.",
    "estimated_duration_minutes": 7,
    "difficulty": "Intermediate",
    "learning_goals": [
      "Αναγνώριση μεταβολής ζωτικών ως μεταβλητών σεναρίου",
      "Χρήση patient/monitor hotspots για αρχική εκτίμηση",
      "Τεκμηρίωση υποστηρικτικής παρέμβασης σε EHR gate",
      "Κλιμάκωση και καταγραφή επικοινωνίας σε δεύτερο gate",
      "Επίδειξη ότι νέο περιστατικό προστίθεται μόνο με νέο JSON"
    ],
    "implementation_notes": {
      "scenario_extension": "Το σενάριο χρησιμοποιεί την ίδια 3D εφαρμογή και προστέθηκε ως ανεξάρτητο JSON στο φάκελο scenarios.",
      "score_ui": "Το UI εμφανίζει Performance Score 0-100% με βάση raw_score_points / theoretical_max_points."
    }
  },
  "initial_state": {
    "time_elapsed": 0,
    "current_score": 100,
    "flags": {
      "assessment_complete": false,
      "monitor_reviewed": false,
      "fluid_intervention_complete": false,
      "documentation_1_complete": false,
      "escalation_complete": false,
      "documentation_2_complete": false
    },
    "vitals": {
      "hr": 118,
      "spo2": 96,
      "rr": 22,
      "bp": "90/55",
      "temp": 38.8
    },
    "ui": {
      "active_hotspots": [
        "hs_monitor",
        "hs_patient",
        "hs_ventilator",
        "hs_ehr",
        "hs_call"
      ],
      "monitor_alert": true
    }
  },
  "hotspots": [
    {
      "id": "hs_monitor",
      "label": "Μόνιτορ Ζωτικών (Monitor)"
    },
    {
      "id": "hs_patient",
      "label": "Ασθενής/Κλίνη (Patient)"
    },
    {
      "id": "hs_ventilator",
      "label": "Υποστηρικτικός Εξοπλισμός / Αναπνευστήρας"
    },
    {
      "id": "hs_ehr",
      "label": "Τερματικό EHR (e-Health)"
    },
    {
      "id": "hs_call",
      "label": "Κουμπί Κλήσης (Call Button)"
    }
  ],
  "ehr_config": {
    "forms": {
      "assessment_form": {
        "title": "Κλινική Αξιολόγηση",
        "fields": [
          "observation",
          "skin_color",
          "consciousness"
        ]
      },
      "intervention_form": {
        "title": "Παρεμβάσεις / Υποστήριξη",
        "fields": [
          "device",
          "fluid_rate",
          "intervention_note"
        ]
      },
      "communication_log": {
        "title": "Ημερολόγιο Επικοινωνίας",
        "fields": [
          "recipient",
          "reason",
          "outcome"
        ]
      }
    }
  },
  "rules": {
    "global_rules": [
      {
        "id": "rule_fever_alert",
        "condition": {
          "vitals.temp": {
            "gt": 38.5
          }
        },
        "effects": [
          {
            "type": "ui_visual",
            "target": "hs_monitor",
            "state": "blinking_red"
          },
          {
            "type": "ui_toast",
            "style": "danger",
            "message": "ΣΥΝΑΓΕΡΜΟΣ: Θερμοκρασία > 38.5°C και υπόταση - απαιτείται εκτίμηση."
          }
        ]
      },
      {
        "id": "rule_tachycardia_alert",
        "condition": {
          "vitals.hr": {
            "gt": 125
          }
        },
        "effects": [
          {
            "type": "ui_visual",
            "target": "hs_monitor",
            "state": "blinking_red"
          },
          {
            "type": "ui_toast",
            "style": "warning",
            "message": "Προειδοποίηση: HR > 125 μετά από καθυστέρηση."
          }
        ]
      }
    ]
  },
  "nodes": [
    {
      "id": "n1_start",
      "type": "message",
      "text": "Βρίσκεστε στη ΜΕΘ. Ο ασθενής στην κλίνη 1 έχει πυρετό, ταχυκαρδία και χαμηλή αρτηριακή πίεση (Temp: 38.8°C, HR: 118, BP: 90/55).",
      "next_node_id": "n2_triage_decision"
    },
    {
      "id": "n2_triage_decision",
      "type": "decision",
      "text": "Ποια είναι η πρώτη σου ενέργεια για την αρχική εκτίμηση;",
      "options": [
        {
          "id": "opt_assess_patient",
          "label": "Άμεση αξιολόγηση ασθενούς στην κλίνη",
          "target_hotspot": "hs_patient",
          "effects": {
            "score_delta": 10,
            "state_update": {
              "flags.assessment_complete": true
            },
            "toast": "Παρατηρείς αδυναμία, θερμό δέρμα και γρήγορη αναπνοή."
          },
          "next_node_id": "n3_support_decision"
        },
        {
          "id": "opt_review_monitor",
          "label": "Έλεγχος τάσεων στο μόνιτορ",
          "target_hotspot": "hs_monitor",
          "effects": {
            "score_delta": 5,
            "state_update": {
              "flags.monitor_reviewed": true
            },
            "toast": "Βλέπεις σταδιακή άνοδο HR και πτώση BP στα τελευταία λεπτά."
          },
          "next_node_id": "n3_support_decision"
        }
      ],
      "timeout": {
        "seconds": 25,
        "on_timeout_effects": {
          "vitals_update": {
            "hr": 128,
            "bp": "85/50",
            "rr": 26
          },
          "score_delta": -10,
          "toast": "⚠️ Καθυστέρηση! Η πίεση έπεσε σε 85/50 και το HR ανέβηκε σε 128."
        },
        "next_node_id": "n3_support_decision"
      }
    },
    {
      "id": "n3_support_decision",
      "type": "decision",
      "text": "Ο ασθενής χρειάζεται υποστηρικτική παρέμβαση και καταγραφή της ενέργειας.",
      "options": [
        {
          "id": "opt_support_fluids",
          "label": "Έλεγχος γραμμής/υποστηρικτικού εξοπλισμού και έναρξη υγρών",
          "target_hotspot": "hs_ventilator",
          "effects": {
            "state_update": {
              "flags.fluid_intervention_complete": true
            },
            "vitals_update": {
              "hr": 108,
              "bp": "98/62",
              "rr": 22
            },
            "score_delta": 20,
            "toast": "✅ Η υποστηρικτική παρέμβαση καταγράφηκε ως ενέργεια σεναρίου. Τα ζωτικά βελτιώνονται."
          },
          "next_node_id": "n4_gate_documentation_1"
        },
        {
          "id": "opt_wait_no_action",
          "label": "Αναμονή χωρίς παρέμβαση",
          "target_hotspot": "hs_monitor",
          "effects": {
            "vitals_update": {
              "hr": 132,
              "bp": "82/48",
              "rr": 28
            },
            "score_delta": -20,
            "toast": "⛔ Η αναμονή επιδεινώνει τις μεταβλητές του σεναρίου."
          },
          "next_node_id": "n4_gate_documentation_1"
        }
      ]
    },
    {
      "id": "n4_gate_documentation_1",
      "type": "gate",
      "text": "🛑 GATE: Τεκμηρίωση αρχικής αξιολόγησης και υποστηρικτικής παρέμβασης.",
      "description": "Το σύστημα μπλοκάρει μέχρι να συμπληρωθούν τα απαιτούμενα πεδία στο EHR.",
      "gate_requirements": {
        "target_hotspot": "hs_ehr",
        "required_forms": [
          {
            "form_id": "assessment_form",
            "fields": [
              "observation"
            ]
          },
          {
            "form_id": "intervention_form",
            "fields": [
              "fluid_rate",
              "intervention_note"
            ]
          }
        ]
      },
      "feedback_blocked": "⚠️ Πρέπει να συμπληρώσεις observation, fluid_rate και intervention_note στο EHR.",
      "feedback_success": "✅ Η τεκμηρίωση αξιολόγησης και υποστήριξης αποθηκεύτηκε.",
      "effects_on_pass": {
        "state_update": {
          "flags.documentation_1_complete": true
        },
        "score_delta": 10
      },
      "next_node_id": "n5_reassessment"
    },
    {
      "id": "n5_reassessment",
      "type": "message",
      "text": "10 λεπτά αργότερα... Τα ζωτικά είναι βελτιωμένα αλλά η θερμοκρασία παραμένει αυξημένη. Χρειάζεται απόφαση για κλιμάκωση/ενημέρωση.",
      "next_node_id": "n6_escalation_decision"
    },
    {
      "id": "n6_escalation_decision",
      "type": "decision",
      "text": "Ποια είναι η καταλληλότερη επόμενη ενέργεια στη ροή σεναρίου;",
      "options": [
        {
          "id": "opt_call_physician",
          "label": "Κλήση ιατρού για κλιμάκωση",
          "target_hotspot": "hs_call",
          "effects": {
            "state_update": {
              "flags.escalation_complete": true
            },
            "score_delta": 10,
            "toast": "Έγινε κλήση στον εφημερεύοντα για περαιτέρω οδηγίες."
          },
          "next_node_id": "n7_gate_documentation_2"
        },
        {
          "id": "opt_monitor_only",
          "label": "Συνέχιση παρακολούθησης χωρίς κλήση",
          "target_hotspot": "hs_monitor",
          "effects": {
            "score_delta": -5,
            "toast": "Συνεχίζεις την παρακολούθηση, αλλά δεν έγινε κλιμάκωση."
          },
          "next_node_id": "n8_end_scenario"
        }
      ]
    },
    {
      "id": "n7_gate_documentation_2",
      "type": "gate",
      "text": "🛑 GATE: Καταγραφή επικοινωνίας με ιατρό.",
      "description": "Κατάγραψε σε ποιον έγινε η κλήση, γιατί έγινε και ποιο ήταν το αποτέλεσμα.",
      "gate_requirements": {
        "target_hotspot": "hs_ehr",
        "required_forms": [
          {
            "form_id": "communication_log",
            "fields": [
              "recipient",
              "reason",
              "outcome"
            ]
          }
        ]
      },
      "feedback_blocked": "⚠️ Εκκρεμεί η πλήρης καταγραφή της επικοινωνίας στο EHR.",
      "feedback_success": "✅ Η επικοινωνία τεκμηριώθηκε πλήρως.",
      "effects_on_pass": {
        "state_update": {
          "flags.documentation_2_complete": true
        },
        "score_delta": 5
      },
      "next_node_id": "n8_end_scenario"
    },
    {
      "id": "n8_end_scenario",
      "type": "end",
      "text": "Το δεύτερο σενάριο ολοκληρώθηκε.",
      "debrief_config": {
        "show_score": true,
        "show_decision_path": true,
        "highlight_missed_docs": true,
        "export_log": true,
        "checklist": [
          {
            "label": "Αρχική αξιολόγηση ή έλεγχος monitor",
            "decision_node": "n2_triage_decision"
          },
          {
            "label": "Υποστηρικτική παρέμβαση",
            "flag": "fluid_intervention_complete"
          },
          {
            "label": "Τεκμηρίωση αρχικής αξιολόγησης/παρέμβασης",
            "flag": "documentation_1_complete"
          },
          {
            "label": "Απόφαση κλιμάκωσης ή παρακολούθησης",
            "decision_node": "n6_escalation_decision"
          },
          {
            "label": "Καταγραφή επικοινωνίας όταν έγινε κλήση",
            "required_if_flag": "escalation_complete",
            "then_flag": "documentation_2_complete"
          }
        ]
      }
    }
  ],
  "logging": {
    "enabled": true,
    "log_events": [
      "NODE_ENTER",
      "HOTSPOT_INTERACTION",
      "OPTION_SELECTED",
      "EHR_SUBMIT",
      "VITALS_CHANGE",
      "GATE_BLOCKED",
      "GATE_PASSED"
    ],
    "export_format": "JSON"
  }
};

const SCENARIO_FALLBACKS = {
  'scenarios/icu_scenario_hypoxia_v1.json': DEFAULT_SCENARIO,
  'scenarios/icu_scenario_fever_hypotension_v1.json': FEVER_HYPOTENSION_SCENARIO
};



const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const els = {
  toastStack: $('#toastStack'),
  glRoom: $('#glRoom'), glCanvas: $('#glCanvas'), hotspotLayer: $('#hotspotLayer'), equipmentLabels: $('#equipmentLabels'), monitorHud: $('#monitorHud'), waveCanvas: $('#waveCanvas'),
  scenarioTitle: $('#scenarioTitle'), scenarioMeta: $('#scenarioMeta'), systemStatePill: $('#systemStatePill'),
  scenarioSelect: $('#scenarioSelect'), loadScenarioBtn: $('#loadScenarioBtn'), scenarioFile: $('#scenarioFile'), resetBtn: $('#resetBtn'), helpBtn: $('#helpBtn'),
  scoreBadge: $('#scoreBadge'), nodeBadge: $('#nodeBadge'), nodeText: $('#nodeText'), nodeActions: $('#nodeActions'), timerBox: $('#timerBox'),
  sideHr: $('#sideHr'), sideSpo2: $('#sideSpo2'), sideRr: $('#sideRr'), sideBp: $('#sideBp'), sideTemp: $('#sideTemp'),
  vitalHr: $('#vitalHr'), vitalSpo2: $('#vitalSpo2'), vitalRr: $('#vitalRr'),
  logPreview: $('#logPreview'), exportQuickBtn: $('#exportQuickBtn'),
  ehrDialog: $('#ehrDialog'), ehrForms: $('#ehrForms'), ehrSaveStatus: $('#ehrSaveStatus'), trendCanvas: $('#trendCanvas'), trendRows: $('#trendRows'),
  infoDialog: $('#infoDialog'), infoTitle: $('#infoTitle'), infoSubtitle: $('#infoSubtitle'), infoBody: $('#infoBody'),
  helpDialog: $('#helpDialog'), debriefDialog: $('#debriefDialog'), debriefContent: $('#debriefContent'), exportJsonBtn: $('#exportJsonBtn'), exportCsvBtn: $('#exportCsvBtn'),
  viewOverview: $('#viewOverview'), viewBed: $('#viewBed'), viewMonitor: $('#viewMonitor'), viewEhr: $('#viewEhr'), soundToggleBtn: $('#soundToggleBtn'), tooltip: $('#objectTooltip')
};

let scenario = null;
let scenarioMap = new Map();
let appState = null;
let currentNode = null;
let timerHandle = null;
let messageTimerHandle = null;
let timerDeadline = null;
let logEvents = [];
let decisionPath = [];
let vitalsTrend = [];
let ehrData = { assessment_form: {}, intervention_form: {}, communication_log: {} };
let lastClickedHotspot = null;
let globalToastMemory = new Set();
let animationTime = 0;
let maxScorePoints = 100;
let soundEnabled = false;
let audioCtx = null;
let lastAlarmBeep = 0;

const HOTSPOT_INFO = {
  hs_monitor: { title: 'Μόνιτορ ζωτικών λειτουργιών', subtitle: '3D hotspot: monitor', body: ['Παρουσιάζει HR, SpO2 και RR σε πραγματικό χρόνο.', 'Όταν SpO2 < 90%, η επιφάνεια του monitor και το hotspot μπαίνουν σε κατάσταση συναγερμού.', 'Η επιλογή ιστορικού monitor μπορεί να χρησιμοποιηθεί στο decision tree.'] },
  hs_patient: { title: 'Ασθενής / Κλίνη', subtitle: '3D hotspot: patient bed', body: ['Χρησιμοποιείται για άμεση αξιολόγηση ασθενή.', 'Η αλληλεπίδραση καταγράφεται στο live log ως HOTSPOT_INTERACTION.', 'Η κλίνη είναι μοντέλο WebGL από cuboids, όχι στατική εικόνα.'] },
  hs_ventilator: { title: 'Αναπνευστήρας', subtitle: '3D hotspot: ventilator', body: ['Επιτρέπει παρέμβαση στη ροή σεναρίου, π.χ. αύξηση FiO2.', 'Μετά τη σωστή επιλογή ενημερώνονται τα ζωτικά και η κατάσταση στο EHR.', 'Ο σωλήνας και η μονάδα αναπνευστήρα είναι μέρος της 3D σκηνής.'] },
  hs_ehr: { title: 'Τερματικό EHR', subtitle: '3D hotspot: e-Health module', body: ['Ανοίγει το ηλεκτρονικό αρχείο ασθενούς.', 'Τα documentation gates απαιτούν συμπλήρωση συγκεκριμένων πεδίων.', 'Η αποθήκευση φορμών καταγράφεται ως EHR_SUBMIT.'] },
  hs_call: { title: 'Κουμπί κλήσης', subtitle: '3D hotspot: escalation', body: ['Χρησιμοποιείται για κλιμάκωση/κλήση ιατρού.', 'Η ενέργεια μπορεί να οδηγήσει σε δεύτερο documentation gate.', 'Η επιλογή καταγράφεται στη διαδρομή αποφάσεων.'] }
};

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function escapeHtml(str='') { return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }
function nowIso() { return new Date().toISOString(); }
function computeTheoreticalMaxScore(scn) {
  let total = Number(scn?.initial_state?.current_score || 0);
  for (const node of scn?.nodes || []) {
    if (node.type === 'decision') {
      const best = Math.max(0, ...(node.options || []).map(o => Number(o.effects?.score_delta || 0)));
      total += best;
    }
    if (node.type === 'gate') total += Math.max(0, Number(node.effects_on_pass?.score_delta || 0));
  }
  return Math.max(1, total);
}
function performancePercent() {
  if (!appState) return 0;
  return clamp(Math.round((Number(appState.current_score || 0) / maxScorePoints) * 100), 0, 100);
}
function systolicBpValue(bp) {
  const raw = String(bp ?? '').split('/')[0].replace(',', '.');
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}
function hasActiveMonitorAlarm() {
  if (!appState?.vitals) return false;
  const v = appState.vitals;
  return !!appState.ui?.monitor_alert || Number(v.spo2) < 90 || Number(v.temp) > 38.5 || Number(v.hr) > 125 || (systolicBpValue(v.bp) !== null && systolicBpValue(v.bp) < 90);
}
function activeMonitorStateLabel() {
  if (!appState?.vitals) return 'Κατάσταση: Παρακολούθηση';
  const v = appState.vitals;
  if (Number(v.spo2) < 90) return 'Κατάσταση: Συναγερμός SpO2';
  if (Number(v.temp) > 38.5 && systolicBpValue(v.bp) !== null && systolicBpValue(v.bp) <= 90) return 'Κατάσταση: Πυρετός / Υπόταση';
  if (Number(v.temp) > 38.5) return 'Κατάσταση: Πυρετός';
  if (Number(v.hr) > 125) return 'Κατάσταση: Ταχυκαρδία';
  if (systolicBpValue(v.bp) !== null && systolicBpValue(v.bp) < 90) return 'Κατάσταση: Χαμηλή BP';
  return 'Κατάσταση: Παρακολούθηση';
}
function updateSoundButton() {
  if (!els.soundToggleBtn) return;
  els.soundToggleBtn.textContent = soundEnabled ? 'Ήχος: On' : 'Ήχος: Off';
  els.soundToggleBtn.setAttribute('aria-pressed', String(soundEnabled));
}
function toggleSound() {
  soundEnabled = !soundEnabled;
  if (soundEnabled && !audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  updateSoundButton();
  toast(soundEnabled ? 'Ενεργοποιήθηκε ήχος συναγερμού.' : 'Απενεργοποιήθηκε ήχος συναγερμού.', soundEnabled ? 'success' : 'info');
}
function playBeep(freq=880, duration=.10, gain=.055) {
  if (!soundEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, audioCtx.currentTime + .012);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.connect(g); g.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + duration + .03);
}
function maybeAlarmBeep() {
  if (!soundEnabled || !audioCtx || !appState) return;
  if (hasActiveMonitorAlarm() && animationTime - lastAlarmBeep > 1.35) {
    lastAlarmBeep = animationTime;
    playBeep(920, .09, .045);
    setTimeout(() => playBeep(760, .08, .035), 120);
  }
}
function getPath(obj, path) { return path.split('.').reduce((acc, key) => acc ? acc[key] : undefined, obj); }
function setPath(obj, path, value) { const parts = path.split('.'); let ref = obj; for (let i=0; i<parts.length-1; i++) { if (!ref[parts[i]]) ref[parts[i]] = {}; ref = ref[parts[i]]; } ref[parts.at(-1)] = value; }

function toast(message, style='info') {
  const div = document.createElement('div');
  div.className = `toast ${style}`;
  div.textContent = message;
  els.toastStack?.appendChild(div);
  setTimeout(() => div.remove(), 3800);
}

function logEvent(type, payload={}) {
  const event = { ts: nowIso(), type, node_id: currentNode?.id || null, vitals: deepClone(appState?.vitals || {}), payload };
  logEvents.push(event);
  renderLogPreview();
}
function renderLogPreview() {
  if (!els.logPreview) return;
  els.logPreview.innerHTML = logEvents.slice(-9).reverse().map(ev => `<li><b>${ev.type}</b> <span class="muted">${ev.node_id || ''}</span></li>`).join('');
}

// ---------- Minimal WebGL 3D engine, no external libraries ----------
const V3 = {
  add: (a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], sub: (a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],
  mul: (a,s)=>[a[0]*s,a[1]*s,a[2]*s], dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]],
  norm:(a)=>{ const l=Math.hypot(a[0],a[1],a[2])||1; return [a[0]/l,a[1]/l,a[2]/l]; }
};
function mat4Identity() { return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; }
function mat4Multiply(a,b) {
  const o=new Array(16).fill(0);
  for(let r=0;r<4;r++) for(let c=0;c<4;c++) for(let k=0;k<4;k++) o[c*4+r]+=a[k*4+r]*b[c*4+k];
  return o;
}
function mat4Translate(v) { const m=mat4Identity(); m[12]=v[0]; m[13]=v[1]; m[14]=v[2]; return m; }
function mat4Scale(v) { const m=mat4Identity(); m[0]=v[0]; m[5]=v[1]; m[10]=v[2]; return m; }
function mat4RotY(a) { const c=Math.cos(a), s=Math.sin(a); return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]; }
function mat4RotX(a) { const c=Math.cos(a), s=Math.sin(a); return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]; }
function mat4Perspective(fovy, aspect, near, far) {
  const f=1/Math.tan(fovy/2), nf=1/(near-far);
  return [f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0];
}
function mat4LookAt(eye, center, up) {
  const z=V3.norm(V3.sub(eye, center)); const x=V3.norm(V3.cross(up, z)); const y=V3.cross(z, x);
  return [x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -V3.dot(x,eye),-V3.dot(y,eye),-V3.dot(z,eye),1];
}
function transformPoint(m, p) {
  const x=p[0], y=p[1], z=p[2], w=1;
  return [m[0]*x+m[4]*y+m[8]*z+m[12]*w, m[1]*x+m[5]*y+m[9]*z+m[13]*w, m[2]*x+m[6]*y+m[10]*z+m[14]*w, m[3]*x+m[7]*y+m[11]*z+m[15]*w];
}
function makeModel(pos, scale, ry=0, rx=0) { return mat4Multiply(mat4Translate(pos), mat4Multiply(mat4RotY(ry), mat4Multiply(mat4RotX(rx), mat4Scale(scale)))); }

const cube = (() => {
  const faces = [
    [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[0,0,1]], [[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1],[0,0,-1]],
    [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[0,1,0]], [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,-1,0]],
    [[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1],[1,0,0]], [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,0,0]]
  ];
  const pos=[], norm=[];
  for (const f of faces) { const [a,b,c,d,n]=f; for (const p of [a,b,c,a,c,d]) { pos.push(...p); norm.push(...n); } }
  return { pos:new Float32Array(pos), norm:new Float32Array(norm), count: pos.length/3 };
})();

let gl, glProgram, glBuffers, sceneObjects=[];
const camera = { yaw: .25, pitch: .22, dist: 5.4, target: [0, .9, -.45], eye: [0,0,0], view:null, proj:null, vp:null };
let drag = { active:false, x:0, y:0 };
const keysDown = new Set();

function initWebGL() {
  gl = els.glCanvas.getContext('webgl', { antialias: true, alpha: false });
  if (!gl) { ensureHotspotButtons(); toast('Ο browser δεν υποστηρίζει WebGL. Η εφαρμογή χρειάζεται WebGL για το 3D περιβάλλον.', 'danger'); return; }
  const vs = `attribute vec3 aPos; attribute vec3 aNormal; uniform mat4 uMVP; uniform mat4 uModel; uniform vec3 uColor; uniform vec3 uLight; varying vec3 vColor; void main(){ vec3 n = normalize((uModel * vec4(aNormal, 0.0)).xyz); float d = max(dot(n, normalize(uLight)), 0.0); float shade = 0.38 + d * 0.62; vColor = uColor * shade; gl_Position = uMVP * vec4(aPos, 1.0); }`;
  const fs = `precision mediump float; varying vec3 vColor; void main(){ gl_FragColor = vec4(vColor, 1.0); }`;
  const vsh=compile(gl.VERTEX_SHADER,vs), fsh=compile(gl.FRAGMENT_SHADER,fs);
  glProgram=gl.createProgram(); gl.attachShader(glProgram,vsh); gl.attachShader(glProgram,fsh); gl.linkProgram(glProgram);
  if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(glProgram));
  gl.useProgram(glProgram);
  glProgram.aPos = gl.getAttribLocation(glProgram,'aPos'); glProgram.aNormal = gl.getAttribLocation(glProgram,'aNormal');
  glProgram.uMVP = gl.getUniformLocation(glProgram,'uMVP'); glProgram.uModel = gl.getUniformLocation(glProgram,'uModel');
  glProgram.uColor = gl.getUniformLocation(glProgram,'uColor'); glProgram.uLight = gl.getUniformLocation(glProgram,'uLight');
  glBuffers = { pos: gl.createBuffer(), norm: gl.createBuffer() };
  gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers.pos); gl.bufferData(gl.ARRAY_BUFFER, cube.pos, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(glProgram.aPos); gl.vertexAttribPointer(glProgram.aPos, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers.norm); gl.bufferData(gl.ARRAY_BUFFER, cube.norm, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(glProgram.aNormal); gl.vertexAttribPointer(glProgram.aNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.clearColor(0.02, 0.07, 0.1, 1);
  buildSceneObjects();
  bindCameraControls();
  requestAnimationFrame(animate3D);
}
function compile(type, source) { const sh=gl.createShader(type); gl.shaderSource(sh, source); gl.compileShader(sh); if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh)); return sh; }

function buildSceneObjects() {
  sceneObjects = [
    { name:'floor', pos:[0,-.05,0], scale:[3.4,.05,2.55], color:[.28,.42,.50] },
    { name:'back_wall', pos:[0,1.35,-2.55], scale:[3.4,1.35,.05], color:[.23,.39,.49] },
    { name:'left_wall', pos:[-3.4,1.35,0], scale:[.05,1.35,2.55], color:[.18,.33,.43] },
    { name:'ceiling_light', pos:[0,2.55,-.55], scale:[.82,.035,.36], color:[.85,.96,1.0] },
    { name:'bed_base', pos:[-.05,.36,.05], scale:[1.25,.15,.48], color:[.48,.62,.70], hotspot:'hs_patient' },
    { name:'mattress', pos:[-.05,.56,.05], scale:[1.18,.15,.43], color:[.82,.91,.96], hotspot:'hs_patient' },
    { name:'pillow', pos:[-.92,.74,-.03], scale:[.26,.08,.36], color:[.93,.98,1], hotspot:'hs_patient' },
    { name:'rail_front', pos:[-.05,.83,.56], scale:[1.22,.04,.04], color:[.74,.86,.91], hotspot:'hs_patient' },
    { name:'rail_back', pos:[-.05,.83,-.46], scale:[1.22,.04,.04], color:[.74,.86,.91], hotspot:'hs_patient' },
    { name:'patient_torso', pos:[-.25,.78,.03], scale:[.48,.14,.26], color:[.62,.78,.86], hotspot:'hs_patient', dynamic:'breathing' },
    { name:'patient_head', pos:[-.84,.81,.02], scale:[.16,.15,.16], color:[.73,.86,.90], hotspot:'hs_patient' },
    { name:'patient_legs', pos:[.37,.73,.03], scale:[.45,.10,.20], color:[.56,.70,.79], hotspot:'hs_patient' },
    { name:'monitor_frame', pos:[-2.05,1.55,-1.78], scale:[.66,.46,.035], color:[.64,.77,.83], hotspot:'hs_monitor' },
    { name:'monitor_screen', pos:[-2.05,1.55,-1.70], scale:[.58,.38,.045], color:[.02,.08,.09], hotspot:'hs_monitor', alarm:true },
    { name:'monitor_stand', pos:[-2.05,.82,-1.76], scale:[.035,.55,.035], color:[.55,.65,.70], hotspot:'hs_monitor' },
    { name:'monitor_base', pos:[-2.05,.24,-1.76], scale:[.34,.05,.22], color:[.45,.56,.61], hotspot:'hs_monitor' },
    { name:'cart', pos:[-2.05,.48,-1.42], scale:[.42,.16,.28], color:[.55,.67,.74], hotspot:'hs_monitor' },
    { name:'vent_body', pos:[1.65,.82,-1.18], scale:[.36,.56,.28], color:[.54,.67,.73], hotspot:'hs_ventilator' },
    { name:'vent_screen', pos:[1.65,1.18,-1.47], scale:[.26,.16,.035], color:[.02,.11,.12], hotspot:'hs_ventilator' },
    { name:'vent_base', pos:[1.65,.21,-1.18], scale:[.48,.06,.36], color:[.43,.53,.59], hotspot:'hs_ventilator' },
    { name:'vent_tube_h', pos:[.94,1.08,-.72], scale:[.58,.035,.035], color:[.42,.82,.90], hotspot:'hs_ventilator' },
    { name:'vent_tube_v', pos:[.36,.91,-.72], scale:[.035,.22,.035], color:[.42,.82,.90], hotspot:'hs_ventilator' },
    { name:'ehr_frame', pos:[2.18,1.32,.12], scale:[.50,.66,.035], ry:-.30, color:[.30,.43,.53], hotspot:'hs_ehr' },
    { name:'ehr_screen', pos:[2.18,1.32,.19], scale:[.43,.58,.055], ry:-.30, color:[.03,.12,.16], hotspot:'hs_ehr' },
    { name:'ehr_stand', pos:[2.18,.58,.12], scale:[.035,.50,.035], ry:-.30, color:[.49,.60,.66], hotspot:'hs_ehr' },
    { name:'ehr_base', pos:[2.18,.10,.12], scale:[.35,.05,.25], ry:-.30, color:[.44,.54,.61], hotspot:'hs_ehr' },
    { name:'call_button', pos:[1.22,1.28,-2.45], scale:[.16,.16,.035], color:[.93,.12,.22], hotspot:'hs_call' },
    { name:'iv_pole', pos:[-.95,1.12,-1.08], scale:[.025,.90,.025], color:[.68,.80,.86] },
    { name:'iv_bag', pos:[-.82,1.74,-1.08], scale:[.12,.20,.035], color:[.70,.92,1.0] },
    { name:'iv_hook', pos:[-.86,1.96,-1.08], scale:[.16,.015,.015], color:[.68,.80,.86] },
    { name:'iv_drip_chamber', pos:[-.82,1.48,-1.08], scale:[.045,.11,.035], color:[.78,.95,1.0] },
    { name:'iv_tube', pos:[-.70,1.13,-.72], scale:[.012,.44,.012], color:[.45,.86,.95] },
    { name:'wall_gas_panel', pos:[-.58,1.46,-2.47], scale:[.28,.16,.025], color:[.58,.72,.78] },
    { name:'oxygen_port_blue', pos:[-.67,1.46,-2.42], scale:[.045,.045,.02], color:[.25,.66,.95] },
    { name:'oxygen_port_green', pos:[-.56,1.46,-2.42], scale:[.045,.045,.02], color:[.30,.85,.55] },
    { name:'supply_shelf', pos:[-.80,1.85,-2.44], scale:[.55,.035,.13], color:[.60,.72,.78] },
    { name:'alarm_light', pos:[1.22,1.69,-2.44], scale:[.12,.055,.035], color:[.95,.18,.24], dynamic:'alarm_blink', hotspot:'hs_call' }
  ];
  for (let i=-6; i<=6; i++) {
    sceneObjects.push({ name:`floor_grid_x_${i}`, pos:[i*.52,.012,0], scale:[.006,.006,2.50], color:[.36,.53,.60] });
    sceneObjects.push({ name:`floor_grid_z_${i}`, pos:[0,.014,i*.40], scale:[3.30,.006,.006], color:[.36,.53,.60] });
  }
}

const hotspotAnchors = {
  hs_monitor: { label:'Μόνιτορ', pos:[-2.05,2.08,-1.63] },
  hs_patient: { label:'Ασθενής / Κλίνη', pos:[-.05,1.18,.30] },
  hs_ventilator: { label:'Αναπνευστήρας', pos:[1.65,1.62,-1.18] },
  hs_ehr: { label:'EHR', pos:[2.18,2.02,.19] },
  hs_call: { label:'Call', pos:[1.22,1.57,-2.42] }
};

const equipmentLabels = {
  lbl_waves: { text:'δυναμικές κυματομορφές', pos:[-2.05,1.90,-1.49] },
  lbl_iv: { text:'IV / ορός', pos:[-.82,2.05,-1.08] },
  lbl_gas: { text:'παροχές οξυγόνου', pos:[-.58,1.73,-2.40] },
  lbl_ehr: { text:'ψηφιακό EHR panel', pos:[2.18,1.67,.22] }
};
function ensureEquipmentLabels() {
  if (!els.equipmentLabels || els.equipmentLabels.children.length) return;
  for (const [id, data] of Object.entries(equipmentLabels)) {
    const label = document.createElement('div');
    label.className = 'equipment-label';
    label.dataset.label = id;
    label.textContent = data.text;
    label.style.opacity = '0';
    els.equipmentLabels.appendChild(label);
  }
}
function updateEquipmentLabels() {
  ensureEquipmentLabels();
  for (const [id, data] of Object.entries(equipmentLabels)) {
    const label = document.querySelector(`[data-label="${id}"]`); if (!label) continue;
    const p = project(data.pos);
    if (!p || !p.visible) { label.style.opacity='0'; continue; }
    label.style.opacity='.82'; label.style.left=`${p.x}px`; label.style.top=`${p.y}px`;
  }
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = els.glCanvas.getBoundingClientRect();
  const w = Math.max(1, Math.floor(rect.width*dpr)); const h = Math.max(1, Math.floor(rect.height*dpr));
  if (els.glCanvas.width !== w || els.glCanvas.height !== h) { els.glCanvas.width=w; els.glCanvas.height=h; }
  if (gl) gl.viewport(0,0,w,h);
}
function updateCamera(dt=0) {
  if (keysDown.size) {
    const speed = dt * 1.5;
    const forward = [Math.sin(camera.yaw), 0, Math.cos(camera.yaw)];
    const right = [Math.cos(camera.yaw), 0, -Math.sin(camera.yaw)];
    if(keysDown.has('w')) camera.target = V3.sub(camera.target, V3.mul(forward, speed));
    if(keysDown.has('s')) camera.target = V3.add(camera.target, V3.mul(forward, speed));
    if(keysDown.has('a')) camera.target = V3.sub(camera.target, V3.mul(right, speed));
    if(keysDown.has('d')) camera.target = V3.add(camera.target, V3.mul(right, speed));
    camera.target[0] = clamp(camera.target[0], -1.2, 1.6); camera.target[2] = clamp(camera.target[2], -1.7, 1.0);
  }
  const cp=Math.cos(camera.pitch);
  camera.eye = [camera.target[0] + camera.dist*Math.sin(camera.yaw)*cp, camera.target[1] + camera.dist*Math.sin(camera.pitch), camera.target[2] + camera.dist*Math.cos(camera.yaw)*cp];
  const aspect = els.glCanvas.width / Math.max(1, els.glCanvas.height);
  camera.proj = mat4Perspective(Math.PI/4.2, aspect, .05, 60);
  camera.view = mat4LookAt(camera.eye, camera.target, [0,1,0]);
  camera.vp = mat4Multiply(camera.proj, camera.view);
}
function drawObject(obj) {
  const blink = obj.alarm && hasActiveMonitorAlarm();
  let color = blink ? (Math.sin(animationTime*8)>0 ? [1.0,.08,.16] : [.20,.02,.03]) : obj.color;
  let pos = obj.pos;
  let scale = obj.scale;
  if (obj.dynamic === 'breathing') {
    const breath = Math.sin(animationTime * 1.65) * .018;
    pos = [obj.pos[0], obj.pos[1] + breath, obj.pos[2]];
    scale = [obj.scale[0], obj.scale[1] + Math.abs(breath)*.85, obj.scale[2]];
  }
  if (obj.dynamic === 'alarm_blink') {
    const on = hasActiveMonitorAlarm() && Math.sin(animationTime*9) > -0.15;
    color = on ? [1.0,.04,.10] : [.35,.04,.06];
    const pulse = on ? 1.18 : 1.0;
    scale = [obj.scale[0]*pulse, obj.scale[1]*pulse, obj.scale[2]*pulse];
  }
  const model = makeModel(pos, scale, obj.ry||0, obj.rx||0);
  const mvp = mat4Multiply(camera.vp, model);
  gl.uniformMatrix4fv(glProgram.uMVP, false, new Float32Array(mvp));
  gl.uniformMatrix4fv(glProgram.uModel, false, new Float32Array(model));
  gl.uniform3fv(glProgram.uColor, new Float32Array(color));
  gl.uniform3fv(glProgram.uLight, new Float32Array([.3,.8,.65]));
  gl.drawArrays(gl.TRIANGLES, 0, cube.count);
}
function draw3D() {
  if (!gl) return;
  resizeCanvas();
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  sceneObjects.forEach(drawObject);
  updateHotspotPositions();
}
function animate3D(ts) {
  const prev=animationTime; animationTime = ts/1000;
  updateCamera(Math.min(.05, animationTime - prev || .016));
  draw3D();
  drawWaveform();
  maybeAlarmBeep();
  requestAnimationFrame(animate3D);
}
function project(pos) {
  const clip = transformPoint(camera.vp, pos); const w=clip[3];
  if (w <= .001) return null;
  const ndc=[clip[0]/w, clip[1]/w, clip[2]/w];
  if (ndc[2] < -1 || ndc[2] > 1) return null;
  const rect = els.glCanvas.getBoundingClientRect();
  return { x:(ndc[0]*.5+.5)*rect.width, y:(-.5*ndc[1]+.5)*rect.height, z:ndc[2], visible: ndc[0] > -1.15 && ndc[0] < 1.15 && ndc[1] > -1.15 && ndc[1] < 1.15 };
}
function updateHotspotPositions() {
  ensureHotspotButtons();
  ensureEquipmentLabels();
  updateEquipmentLabels();
  for (const [id, data] of Object.entries(hotspotAnchors)) {
    const btn = document.querySelector(`[data-hotspot="${id}"]`); if (!btn) continue;
    const p = project(data.pos);
    if (!p || !p.visible) { btn.style.opacity='0'; btn.style.pointerEvents='none'; continue; }
    btn.style.opacity='1'; btn.style.pointerEvents='auto'; btn.style.left = `${p.x}px`; btn.style.top = `${p.y}px`;
    btn.classList.toggle('alarm', id==='hs_monitor' && hasActiveMonitorAlarm());
  }
  const monitor = project([-2.05,1.63,-1.50]);
  if (monitor) { els.monitorHud.style.left = `${monitor.x - 110}px`; els.monitorHud.style.top = `${monitor.y - 50}px`; els.monitorHud.style.opacity = monitor.visible ? '1' : '0'; }
  const wv = project([-2.05,1.55,-1.48]);
  if (wv) { els.waveCanvas.style.left = `${wv.x - 110}px`; els.waveCanvas.style.top = `${wv.y - 42}px`; els.waveCanvas.style.opacity = wv.visible ? '.92' : '0'; }
}
function ensureHotspotButtons() {
  if (!els.hotspotLayer || els.hotspotLayer.children.length) return;
  for (const [id, data] of Object.entries(hotspotAnchors)) {
    const b=document.createElement('button');
    b.className='hotspot-3d';
    b.dataset.hotspot=id;
    b.type='button';
    b.textContent=data.label;
    b.style.opacity = '0';
    b.style.pointerEvents = 'none';

    // Important: the camera also listens for pointer events on the 3D room.
    // Stop propagation here so a hotspot press is treated as an interaction,
    // not as a camera drag. Use pointerup as the primary activation event,
    // because some browsers suppress click after pointer capture/drag logic.
    let downPos = null;
    b.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      downPos = { x: e.clientX, y: e.clientY };
      drag.active = false;
    });
    b.addEventListener('pointermove', (e) => e.stopPropagation());
    b.addEventListener('pointerup', (e) => {
      e.stopPropagation();
      const moved = downPos ? Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) : 0;
      downPos = null;
      if (moved <= 8) handleHotspotClick(id);
    });
    b.addEventListener('click', (e) => {
      // Activation is handled on pointerup to avoid lost clicks after camera events.
      e.preventDefault();
      e.stopPropagation();
    });
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        handleHotspotClick(id);
      }
    });
    b.addEventListener('mouseenter', (e) => showTooltip(id, e));
    b.addEventListener('mouseleave', () => els.tooltip.classList.add('hidden'));
    els.hotspotLayer.appendChild(b);
  }
}
function bindCameraControls() {
  const room = els.glRoom;
  room.addEventListener('pointerdown', e => {
    if (e.target.closest?.('.hotspot-3d, button, input, select, textarea, dialog')) return;
    drag.active=true; drag.x=e.clientX; drag.y=e.clientY; room.classList.add('dragging'); room.setPointerCapture(e.pointerId);
  });
  room.addEventListener('pointermove', e => {
    if (!drag.active) return;
    const dx=e.clientX-drag.x, dy=e.clientY-drag.y; drag.x=e.clientX; drag.y=e.clientY;
    camera.yaw -= dx*.006; camera.pitch = clamp(camera.pitch + dy*.004, -.15, 1.1);
  });
  room.addEventListener('pointerup', e => { drag.active=false; room.classList.remove('dragging'); try { room.releasePointerCapture(e.pointerId); } catch {} });
  room.addEventListener('wheel', e => { e.preventDefault(); camera.dist = clamp(camera.dist + e.deltaY*.004, 2.0, 8.0); }, { passive:false });
  room.addEventListener('click', e => {
    if (e.target.closest?.('.hotspot-3d, button, input, select, textarea, dialog')) return;
    if (e.target !== els.glCanvas) return;
    const rect = els.glCanvas.getBoundingClientRect(); const x=e.clientX-rect.left, y=e.clientY-rect.top;
    let best=null;
    for (const [id,data] of Object.entries(hotspotAnchors)) { const p=project(data.pos); if(!p || !p.visible) continue; const d=Math.hypot(p.x-x,p.y-y); if(d<80 && (!best || d<best.d)) best={id,d}; }
    if (best) handleHotspotClick(best.id);
  });
  window.addEventListener('keydown', e => { const k=e.key.toLowerCase(); if(['w','a','s','d'].includes(k)) keysDown.add(k); });
  window.addEventListener('keyup', e => keysDown.delete(e.key.toLowerCase()));
  window.addEventListener('resize', resizeCanvas);
  els.viewOverview.addEventListener('click', () => setCamera(.25,.22,5.4,[0,.9,-.45]));
  els.viewBed.addEventListener('click', () => setCamera(.05,.28,3.2,[-.15,.85,.05]));
  els.viewMonitor.addEventListener('click', () => setCamera(-.45,.22,2.8,[-1.75,1.35,-1.35]));
  els.viewEhr.addEventListener('click', () => setCamera(.72,.24,2.75,[1.70,1.16,.18]));
}
function setCamera(yaw,pitch,dist,target) { camera.yaw=yaw; camera.pitch=pitch; camera.dist=dist; camera.target=target; logEvent('CAMERA_VIEW', { yaw,pitch,dist,target }); }
function showTooltip(id, e) {
  const info=HOTSPOT_INFO[id]; if(!info) return;
  const rect = els.glRoom.getBoundingClientRect();
  els.tooltip.textContent = info.title;
  els.tooltip.style.left = `${e.clientX - rect.left + 18}px`;
  els.tooltip.style.top = `${e.clientY - rect.top + 18}px`;
  els.tooltip.classList.remove('hidden');
}

// ---------- Scenario Engine ----------
async function loadScenarioFromList() {
  const selectedPath = els.scenarioSelect.value;
  try {
    const res = await fetch(selectedPath, { cache:'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    initScenario(json);
    toast('Το JSON σενάριο φορτώθηκε από τον φάκελο scenarios.', 'success');
  } catch (err) {
    const fallback = SCENARIO_FALLBACKS[selectedPath] || DEFAULT_SCENARIO;
    initScenario(deepClone(fallback));
    const label = selectedPath.includes('fever_hypotension') ? 'Σενάριο 2: Πυρετός & Υπόταση' : 'Σενάριο 1: Υποξαιμία & Αναπνευστήρας';
    toast(`Χρησιμοποιείται ενσωματωμένο fallback για: ${label}. Για φόρτωση εξωτερικού JSON από λίστα τρέξε μέσω local server.`, 'warning');
  }
}
function initScenario(json) {
  clearTimeout(timerHandle); clearTimeout(messageTimerHandle); timerHandle=null; messageTimerHandle=null; timerDeadline=null;
  scenario = json; scenarioMap = new Map(scenario.nodes.map(n => [n.id, n]));
  maxScorePoints = computeTheoreticalMaxScore(scenario);
  appState = deepClone(scenario.initial_state);
  appState.ui = appState.ui || {}; if (typeof appState.ui.monitor_alert === 'undefined') appState.ui.monitor_alert = appState.vitals?.spo2 < 90;
  ehrData = { assessment_form: {}, intervention_form: {}, communication_log: {} };
  logEvents = []; decisionPath = []; globalToastMemory = new Set(); lastClickedHotspot = null;
  vitalsTrend = [{ t:'T0', ...deepClone(appState.vitals), comment:'Αρχική κατάσταση' }];
  els.scenarioTitle.textContent = scenario.scenario_meta?.title || 'Σενάριο';
  els.scenarioMeta.textContent = ` · ${scenario.scenario_meta?.difficulty || ''} · ${scenario.scenario_meta?.estimated_duration_minutes || ''} λεπτά`;
  buildEhrForms();
  ensureHotspotButtons();
  updateAllDisplays();
  enterNode(scenario.nodes[0]?.id);
}
function enterNode(nodeId) {
  clearTimeout(timerHandle); clearTimeout(messageTimerHandle); timerHandle=null; messageTimerHandle=null; timerDeadline=null;
  currentNode = scenarioMap.get(nodeId);
  if (!currentNode) { toast(`Άγνωστος κόμβος: ${nodeId}`, 'danger'); return; }
  logEvent('NODE_ENTER', { node_type: currentNode.type, text: currentNode.text });
  updateAllDisplays();
  renderNode();
  evaluateGlobalRules();
  if (currentNode.type === 'message') {
    const next = currentNode.next_node_id;
    if (next) messageTimerHandle = setTimeout(() => enterNode(next), 1200);
  } else if (currentNode.type === 'decision' && currentNode.timeout) {
    startNodeTimer(currentNode.timeout);
  } else if (currentNode.type === 'end') {
    showDebrief();
  }
}
function renderNode() {
  els.nodeBadge.textContent = currentNode.id;
  els.nodeText.textContent = currentNode.text || '';
  els.nodeActions.innerHTML = '';
  els.timerBox.classList.add('hidden');
  ensureHotspotButtons();
  clearHotspotHints();
  if (currentNode.type === 'decision') {
    for (const opt of currentNode.options || []) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = `<span>${escapeHtml(opt.label)}</span><br><small class="muted">Hotspot: ${escapeHtml(hotspotAnchors[opt.target_hotspot]?.label || opt.target_hotspot || '-')}</small>`;
      btn.addEventListener('click', () => selectOption(opt));
      els.nodeActions.appendChild(btn);
      highlightHotspot(opt.target_hotspot);
    }
  } else if (currentNode.type === 'gate') {
    const btn = document.createElement('button'); btn.type='button'; btn.textContent='Άνοιγμα EHR για τεκμηρίωση';
    btn.addEventListener('click', () => openEhr()); els.nodeActions.appendChild(btn);
    const check = document.createElement('button'); check.type='button'; check.className='secondary'; check.textContent='Έλεγχος Gate / Συνέχεια';
    check.addEventListener('click', () => attemptGatePass()); els.nodeActions.appendChild(check);
    highlightHotspot(currentNode.gate_requirements?.target_hotspot);
  } else if (currentNode.type === 'end') {
    const btn = document.createElement('button'); btn.type='button'; btn.textContent='Άνοιγμα Debrief'; btn.addEventListener('click', showDebrief); els.nodeActions.appendChild(btn);
  }
}
function startNodeTimer(timeout) {
  const secs = timeout.seconds || 30;
  timerDeadline = Date.now() + secs*1000;
  els.timerBox.classList.remove('hidden');
  function tick() {
    const remain = Math.max(0, Math.ceil((timerDeadline-Date.now())/1000));
    els.timerBox.textContent = `Χρονικός κανόνας: ${remain}s μέχρι timeout`;
    if (remain <= 0) {
      applyEffects(timeout.on_timeout_effects || {}, 'TIMEOUT');
      logEvent('TIMEOUT', { timeout_seconds: secs });
      enterNode(timeout.next_node_id || currentNode.next_node_id);
    } else timerHandle = setTimeout(tick, 250);
  }
  tick();
}
function selectOption(opt) {
  clearTimeout(timerHandle); timerHandle=null; timerDeadline=null;
  decisionPath.push({ node_id: currentNode.id, option_id: opt.id, label: opt.label });
  logEvent('OPTION_SELECTED', { option_id: opt.id, label: opt.label, target_hotspot: opt.target_hotspot });
  applyEffects(opt.effects || {}, 'OPTION_EFFECT');
  enterNode(opt.next_node_id);
}
function applyEffects(effects, reason='EFFECT') {
  if (effects.score_delta) appState.current_score += effects.score_delta;
  if (effects.state_update) for (const [path, val] of Object.entries(effects.state_update)) setPath(appState, path, val);
  if (effects.vitals_update) {
    Object.assign(appState.vitals, effects.vitals_update);
    vitalsTrend.push({ t:`T${vitalsTrend.length}`, ...deepClone(appState.vitals), comment: reason });
    logEvent('VITALS_CHANGE', { vitals_update: effects.vitals_update, reason });
  }
  if (effects.toast) toast(effects.toast, reason === 'TIMEOUT' ? 'warning' : 'success');
  updateAllDisplays();
  evaluateGlobalRules();
}
function evaluateGlobalRules() {
  appState.ui.monitor_alert = false;
  for (const rule of scenario.rules?.global_rules || []) {
    if (conditionMatches(rule.condition || {})) {
      for (const eff of rule.effects || []) {
        if (eff.type === 'ui_visual' && eff.target === 'hs_monitor') appState.ui.monitor_alert = true;
        if (eff.type === 'ui_toast' && !globalToastMemory.has(rule.id)) { toast(eff.message, eff.style || 'danger'); globalToastMemory.add(rule.id); }
      }
    }
  }
  updateAllDisplays(false);
}
function conditionMatches(cond) {
  for (const [path, test] of Object.entries(cond)) {
    const val = getPath(appState, path);
    if (typeof test === 'object') {
      if ('lt' in test && !(val < test.lt)) return false;
      if ('lte' in test && !(val <= test.lte)) return false;
      if ('gt' in test && !(val > test.gt)) return false;
      if ('gte' in test && !(val >= test.gte)) return false;
      if ('eq' in test && !(val === test.eq)) return false;
    } else if (val !== test) return false;
  }
  return true;
}
function attemptGatePass() {
  const req = currentNode.gate_requirements;
  const missing = [];
  for (const formReq of req?.required_forms || []) {
    for (const field of formReq.fields || []) {
      const v = ehrData[formReq.form_id]?.[field];
      if (!v || String(v).trim() === '') missing.push(`${formReq.form_id}.${field}`);
    }
  }
  if (missing.length) {
    toast(currentNode.feedback_blocked || 'Ελλιπής τεκμηρίωση.', 'warning');
    logEvent('GATE_BLOCKED', { missing });
    openEhr();
    return false;
  }
  applyEffects(currentNode.effects_on_pass || {}, 'GATE_PASS');
  toast(currentNode.feedback_success || 'Το gate ολοκληρώθηκε.', 'success');
  logEvent('GATE_PASSED', { gate_id: currentNode.id });
  enterNode(currentNode.next_node_id);
  return true;
}
function handleHotspotClick(id) {
  lastClickedHotspot = id;
  logEvent('HOTSPOT_INTERACTION', { hotspot_id: id, label: hotspotAnchors[id]?.label });
  if (id === 'hs_ehr') { openEhr(); return; }
  if (currentNode?.type === 'decision') {
    const matches = (currentNode.options || []).filter(o => o.target_hotspot === id);
    if (matches.length === 1) { selectOption(matches[0]); return; }
    if (matches.length > 1) { toast('Υπάρχουν περισσότερες από μία επιλογές για αυτό το hotspot. Επίλεξε από το panel.', 'warning'); return; }
  }
  if (currentNode?.type === 'gate' && currentNode.gate_requirements?.target_hotspot === id) { openEhr(); return; }
  showInfoForHotspot(id);
}
function showInfoForHotspot(id) {
  const info = HOTSPOT_INFO[id]; if (!info) return;
  els.infoTitle.textContent = info.title; els.infoSubtitle.textContent = info.subtitle;
  els.infoBody.innerHTML = `<ul>${info.body.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
  els.infoDialog.showModal();
}
function highlightHotspot(id) { if(!id) return; const b=document.querySelector(`[data-hotspot="${id}"]`); if(b) b.classList.add('active-hint'); }
function clearHotspotHints() { $$('.hotspot-3d').forEach(b => b.classList.remove('active-hint')); }

// ---------- EHR ----------
const FIELD_LABELS = {
  observation:'Παρατήρηση', skin_color:'Χρώμα δέρματος', consciousness:'Επίπεδο συνείδησης',
  device:'Συσκευή/εξοπλισμός', fiO2_setting:'Ρύθμιση FiO2', flow_rate:'Ροή οξυγόνου',
  fluid_rate:'Ρυθμός/όγκος υγρών', intervention_note:'Σημείωση παρέμβασης', reassessment_note:'Σημείωση επανεκτίμησης',
  recipient:'Παραλήπτης', reason:'Λόγος επικοινωνίας', outcome:'Αποτέλεσμα'
};
function buildEhrForms() {
  els.ehrForms.innerHTML = '';
  for (const [formId, cfg] of Object.entries(scenario.ehr_config?.forms || {})) {
    const pane=document.createElement('div'); pane.id=formId; pane.className='ehr-pane';
    pane.innerHTML = `<div class="form-card"><h3>${escapeHtml(cfg.title)}</h3><div class="form-grid"></div><button type="button" class="save-form">Αποθήκευση φόρμας</button></div>`;
    const grid=pane.querySelector('.form-grid');
    for (const field of cfg.fields || []) {
      const req = isFieldRequired(formId, field) ? ' <span class="required">*</span>' : '';
      const row=document.createElement('div'); row.className='form-field';
      const isLong = ['observation','reason','outcome'].includes(field);
      row.innerHTML = `<label for="${formId}_${field}">${escapeHtml(FIELD_LABELS[field] || field)}${req}</label>${isLong ? `<textarea id="${formId}_${field}"></textarea>` : `<input id="${formId}_${field}" type="text" />`}`;
      grid.appendChild(row);
    }
    pane.querySelector('.save-form').addEventListener('click', () => saveEhrForm(formId));
    els.ehrForms.appendChild(pane);
  }
  bindEhrTabs();
  renderTrendTable(); drawTrendChart();
}
function isFieldRequired(formId, field) {
  return scenario.nodes.some(n => n.type==='gate' && (n.gate_requirements?.required_forms || []).some(fr => fr.form_id===formId && fr.fields?.includes(field)));
}
function bindEhrTabs() {
  $$('.ehr-tab').forEach(btn => btn.onclick = () => setEhrTab(btn.dataset.tab));
}
function setEhrTab(tab) {
  $$('.ehr-tab').forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
  $$('.ehr-pane').forEach(p => p.classList.remove('active-pane'));
  if (tab === 'overview') $('#ehrOverview').classList.add('active-pane'); else $(`#${tab}`)?.classList.add('active-pane');
}
function openEhr() { renderTrendTable(); drawTrendChart(); els.ehrDialog.showModal(); logEvent('EHR_OPEN', {}); }
function saveEhrForm(formId) {
  const fields = scenario.ehr_config?.forms?.[formId]?.fields || [];
  for (const field of fields) { const input = $(`#${formId}_${field}`); ehrData[formId][field] = input?.value || ''; }
  els.ehrSaveStatus.textContent = `Αποθηκεύτηκε: ${scenario.ehr_config.forms[formId].title}`;
  toast('Η φόρμα EHR αποθηκεύτηκε.', 'success');
  logEvent('EHR_SUBMIT', { form_id: formId, fields: deepClone(ehrData[formId]) });
  if (currentNode?.type === 'gate') attemptGatePass();
}
function renderTrendTable() {
  els.trendRows.innerHTML = vitalsTrend.map(r => `<tr><td>${escapeHtml(r.t)}</td><td>${r.hr}</td><td>${r.spo2}%</td><td>${r.rr}</td><td>${escapeHtml(r.comment || '')}</td></tr>`).join('');
}
function drawTrendChart() {
  const c=els.trendCanvas, ctx=c.getContext('2d'); const w=c.width,h=c.height; ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#06131d'; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.lineWidth=1; for(let i=1;i<5;i++){ ctx.beginPath(); ctx.moveTo(0,i*h/5); ctx.lineTo(w,i*h/5); ctx.stroke(); }
  const data=vitalsTrend.length ? vitalsTrend : [{spo2:appState?.vitals?.spo2||0,hr:appState?.vitals?.hr||0}];
  function line(key,min,max,color) { ctx.strokeStyle=color; ctx.lineWidth=3; ctx.beginPath(); data.forEach((p,i)=>{ const x=28+i*(w-56)/Math.max(1,data.length-1); const y=h-25-((p[key]-min)/(max-min))*(h-55); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke(); }
  line('spo2',75,100,'#8df7c7'); line('hr',70,140,'#53c9ff');
  ctx.fillStyle='#cfeeff'; ctx.font='13px sans-serif'; ctx.fillText('SpO2', 12, 18); ctx.fillText('HR', 72, 18);
}
function drawWaveform() {
  const c=els.waveCanvas; if(!c) return; const ctx=c.getContext('2d'); const w=c.width,h=c.height;
  ctx.clearRect(0,0,w,h); ctx.fillStyle='rgba(0,8,10,.65)'; ctx.fillRect(0,0,w,h);
  const spo2=appState?.vitals?.spo2 ?? 88;
  const alarm = spo2 < 90;
  function wave(y, amp, freq, color, phase=0) {
    ctx.strokeStyle=color; ctx.lineWidth=2; ctx.beginPath();
    for(let x=0;x<w;x++) { const v=Math.sin((x*.06+animationTime*freq)+phase)*amp + Math.sin(x*.19+animationTime*freq*1.4)*amp*.25; x?ctx.lineTo(x,y+v):ctx.moveTo(x,y+v); } ctx.stroke();
  }
  wave(26, 9, 4.0, alarm ? '#ff5d73' : '#8df7c7'); wave(58, 7, 3.1, '#53c9ff', 1.4); wave(87, 5, 2.2, '#ffd166', 2.2);
}

// ---------- UI state/debrief/export ----------
function updateAllDisplays(render=true) {
  if (!appState) return;
  const v=appState.vitals;
  els.sideHr.textContent=v.hr; els.sideSpo2.textContent=`${v.spo2}%`; els.sideRr.textContent=v.rr; els.sideBp.textContent=v.bp; els.sideTemp.textContent=`${v.temp}°C`;
  els.vitalHr.textContent=v.hr; els.vitalSpo2.textContent=`${v.spo2}%`; els.vitalRr.textContent=v.rr;
  const perf = performancePercent();
  els.scoreBadge.innerHTML=`Performance ${perf}% <small>(${appState.current_score}/${maxScorePoints})</small>`;
  els.systemStatePill.textContent = activeMonitorStateLabel();
  els.systemStatePill.style.borderColor = hasActiveMonitorAlarm() ? 'rgba(255,93,115,.55)' : 'rgba(83,201,255,.25)';
  document.body.classList.toggle('alarm-state', hasActiveMonitorAlarm());
  if (render) draw3D();
}
function evaluateDebriefItem(item) {
  if (!item) return false;
  const flagPath = (name) => name?.includes('.') ? name : `flags.${name}`;
  if (item.flag) return !!getPath(appState, flagPath(item.flag));
  if (Array.isArray(item.any_flag)) return item.any_flag.some(f => !!getPath(appState, flagPath(f)));
  if (item.decision_node) return decisionPath.some(d => d.node_id === item.decision_node);
  if (item.decision_option) return decisionPath.some(d => d.option_id === item.decision_option);
  if (item.required_if_flag && item.then_flag) {
    const required = !!getPath(appState, flagPath(item.required_if_flag));
    return !required || !!getPath(appState, flagPath(item.then_flag));
  }
  return false;
}

function buildDebriefChecks(flags) {
  const configured = currentNode?.debrief_config?.checklist || scenario?.nodes?.find(n => n.type === 'end')?.debrief_config?.checklist;
  if (Array.isArray(configured) && configured.length) {
    return configured.map(item => [item.label || item.text || 'Έλεγχος σεναρίου', evaluateDebriefItem(item)]);
  }
  return [
    ['Αρχική αξιολόγηση ή έλεγχος monitor', decisionPath.some(d=>d.node_id==='n2_initial_decision')],
    ['Παρέμβαση στον αναπνευστήρα', !!flags.oxygen_adjusted],
    ['Τεκμηρίωση πρώτου gate', !!flags.documentation_1_complete],
    ['Κλιμάκωση ή τεκμηριωμένη παρακολούθηση', decisionPath.some(d=>d.node_id==='n6_escalation_decision')],
    ['Καταγραφή επικοινωνίας εφόσον έγινε κλήση', !flags.escalation_complete || !!flags.documentation_2_complete]
  ];
}

function showDebrief() {
  const flags=appState.flags || {};
  const missed=[];
  if(!flags.documentation_1_complete) missed.push('Τεκμηρίωση αξιολόγησης/παρέμβασης');
  if(flags.escalation_complete && !flags.documentation_2_complete) missed.push('Καταγραφή επικοινωνίας');
  const checks = buildDebriefChecks(flags);
  els.debriefContent.innerHTML = `
    <div class="debrief-grid">
      <div class="debrief-box"><h3>Performance</h3><p style="font-size:34px;font-weight:900;margin:.2em 0">${performancePercent()}%</p><p class="muted">Raw points: ${appState.current_score}/${maxScorePoints}</p></div>
      <div class="debrief-box"><h3>Αποφάσεις</h3><p>${decisionPath.length} επιλογές</p></div>
      <div class="debrief-box"><h3>Logs</h3><p>${logEvents.length} συμβάντα</p></div>
    </div>
    <h3>Checklist</h3><ul class="checklist">${checks.map(([t,ok])=>`<li class="${ok?'ok':'warn'}">${ok?'✅':'⚠️'} ${escapeHtml(t)}</li>`).join('')}</ul>
    <h3>Διαδρομή αποφάσεων</h3><ol>${decisionPath.map(d=>`<li><b>${escapeHtml(d.node_id)}</b>: ${escapeHtml(d.label)}</li>`).join('') || '<li>Δεν καταγράφηκαν αποφάσεις.</li>'}</ol>
    <h3>Ελλείψεις τεκμηρίωσης</h3><p>${missed.length ? missed.map(escapeHtml).join(', ') : 'Δεν εντοπίστηκαν ελλείψεις στα απαιτούμενα gates.'}</p>
  `;
  els.debriefDialog.showModal();
}
function exportData(format='json') {
  const data = { scenario_id: scenario?.scenario_meta?.id, performance_percent: performancePercent(), raw_score_points: appState?.current_score, max_score_points: maxScorePoints, flags: appState?.flags, decision_path: decisionPath, ehr_data: ehrData, log_events: logEvents };
  if (format === 'csv') {
    const header=['ts','type','node_id','payload'];
    const rows=logEvents.map(ev=>[ev.ts,ev.type,ev.node_id||'',JSON.stringify(ev.payload).replaceAll('"','""')]);
    download('icu_log.csv', [header.join(','), ...rows.map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(','))].join('\n'), 'text/csv');
  } else download('icu_log.json', JSON.stringify(data,null,2), 'application/json');
}
function download(filename, content, type) {
  const blob=new Blob([content], {type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 500);
}

function bindGeneralUi() {
  els.loadScenarioBtn.addEventListener('click', loadScenarioFromList);
  els.scenarioSelect.addEventListener('change', loadScenarioFromList);
  els.resetBtn.addEventListener('click', () => initScenario(scenario || SCENARIO_FALLBACKS[els.scenarioSelect.value] || DEFAULT_SCENARIO));
  els.helpBtn.addEventListener('click', () => els.helpDialog.showModal());
  els.scenarioFile.addEventListener('change', async (e) => {
    const file=e.target.files?.[0]; if(!file) return;
    try { const json=JSON.parse(await file.text()); initScenario(json); toast(`Φορτώθηκε αρχείο: ${file.name}`, 'success'); }
    catch(err) { toast(`Μη έγκυρο JSON: ${err.message}`, 'danger'); }
  });
  els.soundToggleBtn?.addEventListener('click', toggleSound);
  updateSoundButton();
  els.exportQuickBtn.addEventListener('click', () => exportData('json'));
  els.exportJsonBtn.addEventListener('click', () => exportData('json'));
  els.exportCsvBtn.addEventListener('click', () => exportData('csv'));
}

bindGeneralUi();
initWebGL();
loadScenarioFromList();
