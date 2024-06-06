const sub = {
  "object": "list",
  "data": [
    {
      "id": "sub_1POI4SSGVFR9zdBLT8LOGkyM",
      "object": "subscription",
      "application": null,
      "application_fee_percent": null,
      "automatic_tax": {
        "enabled": false,
        "liability": null
      },
      "billing_cycle_anchor": 1717587120,
      "billing_cycle_anchor_config": null,
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": null,
      "cancellation_details": {
        "comment": null,
        "feedback": null,
        "reason": null
      },
      "collection_method": "charge_automatically",
      "created": 1717587120,
      "currency": "gbp",
      "current_period_end": 1717673520,
      "current_period_start": 1717587120,
      "customer": "cus_QElYvWRbN8nDdS",
      "days_until_due": null,
      "default_payment_method": "pm_1POI4QSGVFR9zdBLb1Ym4W3j",
      "default_source": null,
      "default_tax_rates": [],
      "description": null,
      "discount": null,
      "discounts": [],
      "ended_at": null,
      "invoice_settings": {
        "account_tax_ids": null,
        "issuer": {
          "type": "self"
        }
      },
      "items": {
        "object": "list",
        "data": [
          {
            "id": "si_QElbiOYFBIcrOb",
            "object": "subscription_item",
            "billing_thresholds": null,
            "created": 1717587121,
            "discounts": [],
            "metadata": {},
            "plan": {
              "id": "price_1POI0eSGVFR9zdBLeRtfrWyn",
              "object": "plan",
              "active": true,
              "aggregate_usage": null,
              "amount": 9400,
              "amount_decimal": "9400",
              "billing_scheme": "per_unit",
              "created": 1717586884,
              "currency": "gbp",
              "interval": "day",
              "interval_count": 1,
              "livemode": false,
              "metadata": {},
              "meter": null,
              "nickname": null,
              "product": "prod_QElXYQAXBVF8CS",
              "tiers_mode": null,
              "transform_usage": null,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "price": {
              "id": "price_1POI0eSGVFR9zdBLeRtfrWyn",
              "object": "price",
              "active": true,
              "billing_scheme": "per_unit",
              "created": 1717586884,
              "currency": "gbp",
              "custom_unit_amount": null,
              "livemode": false,
              "lookup_key": null,
              "metadata": {},
              "nickname": null,
              "product": "prod_QElXYQAXBVF8CS",
              "recurring": {
                "aggregate_usage": null,
                "interval": "day",
                "interval_count": 1,
                "meter": null,
                "trial_period_days": null,
                "usage_type": "licensed"
              },
              "tax_behavior": "unspecified",
              "tiers_mode": null,
              "transform_quantity": null,
              "type": "recurring",
              "unit_amount": 9400,
              "unit_amount_decimal": "9400"
            },
            "quantity": 1,
            "subscription": "sub_1POI4SSGVFR9zdBLT8LOGkyM",
            "tax_rates": []
          }
        ],
        "has_more": false,
        "total_count": 1,
        "url": "/v1/subscription_items?subscription=sub_1POI4SSGVFR9zdBLT8LOGkyM"
      },
      "latest_invoice": "in_1POI4SSGVFR9zdBLPTU9Id75",
      "livemode": false,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "on_behalf_of": null,
      "pause_collection": null,
      "payment_settings": {
        "payment_method_options": {
          "acss_debit": null,
          "bancontact": null,
          "card": {
            "network": null,
            "request_three_d_secure": "automatic"
          },
          "customer_balance": null,
          "konbini": null,
          "sepa_debit": null,
          "us_bank_account": null
        },
        "payment_method_types": null,
        "save_default_payment_method": "off"
      },
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
        "id": "price_1POI0eSGVFR9zdBLeRtfrWyn",
        "object": "plan",
        "active": true,
        "aggregate_usage": null,
        "amount": 9400,
        "amount_decimal": "9400",
        "billing_scheme": "per_unit",
        "created": 1717586884,
        "currency": "gbp",
        "interval": "day",
        "interval_count": 1,
        "livemode": false,
        "metadata": {},
        "meter": null,
        "nickname": null,
        "product": "prod_QElXYQAXBVF8CS",
        "tiers_mode": null,
        "transform_usage": null,
        "trial_period_days": null,
        "usage_type": "licensed"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1717587120,
      "status": "active",
      "test_clock": null,
      "transfer_data": null,
      "trial_end": null,
      "trial_settings": {
        "end_behavior": {
          "missing_payment_method": "create_invoice"
        }
      },
      "trial_start": null
    },
    {
      "id": "sub_1POI1uSGVFR9zdBLHo61MSKm",
      "object": "subscription",
      "application": null,
      "application_fee_percent": null,
      "automatic_tax": {
        "enabled": false,
        "liability": null
      },
      "billing_cycle_anchor": 1717586962,
      "billing_cycle_anchor_config": null,
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": null,
      "cancellation_details": {
        "comment": null,
        "feedback": null,
        "reason": null
      },
      "collection_method": "charge_automatically",
      "created": 1717586962,
      "currency": "gbp",
      "current_period_end": 1717673362,
      "current_period_start": 1717586962,
      "customer": "cus_QElYvWRbN8nDdS",
      "days_until_due": null,
      "default_payment_method": "pm_1POI1tSGVFR9zdBLTW3RgnER",
      "default_source": null,
      "default_tax_rates": [],
      "description": null,
      "discount": null,
      "discounts": [],
      "ended_at": null,
      "invoice_settings": {
        "account_tax_ids": null,
        "issuer": {
          "type": "self"
        }
      },
      "items": {
        "object": "list",
        "data": [
          {
            "id": "si_QElZl70w6VyBQl",
            "object": "subscription_item",
            "billing_thresholds": null,
            "created": 1717586962,
            "discounts": [],
            "metadata": {},
            "plan": {
              "id": "price_1PO0M0SGVFR9zdBLJKvtemwW",
              "object": "plan",
              "active": true,
              "aggregate_usage": null,
              "amount": 9900,
              "amount_decimal": "9900",
              "billing_scheme": "per_unit",
              "created": 1717519016,
              "currency": "gbp",
              "interval": "day",
              "interval_count": 1,
              "livemode": false,
              "metadata": {},
              "meter": null,
              "nickname": null,
              "product": "prod_QETI6aAWrpbDl3",
              "tiers_mode": null,
              "transform_usage": null,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "price": {
              "id": "price_1PO0M0SGVFR9zdBLJKvtemwW",
              "object": "price",
              "active": true,
              "billing_scheme": "per_unit",
              "created": 1717519016,
              "currency": "gbp",
              "custom_unit_amount": null,
              "livemode": false,
              "lookup_key": null,
              "metadata": {},
              "nickname": null,
              "product": "prod_QETI6aAWrpbDl3",
              "recurring": {
                "aggregate_usage": null,
                "interval": "day",
                "interval_count": 1,
                "meter": null,
                "trial_period_days": null,
                "usage_type": "licensed"
              },
              "tax_behavior": "unspecified",
              "tiers_mode": null,
              "transform_quantity": null,
              "type": "recurring",
              "unit_amount": 9900,
              "unit_amount_decimal": "9900"
            },
            "quantity": 1,
            "subscription": "sub_1POI1uSGVFR9zdBLHo61MSKm",
            "tax_rates": []
          },
          {
            "id": "si_QEnGKNLwmNHYVe",
            "object": "subscription_item",
            "billing_thresholds": null,
            "created": 1717593268,
            "discounts": [],
            "metadata": {},
            "plan": {
              "id": "price_1POJN8SGVFR9zdBLih02bpCw",
              "object": "plan",
              "active": true,
              "aggregate_usage": null,
              "amount": 1900,
              "amount_decimal": "1900",
              "billing_scheme": "per_unit",
              "created": 1717592122,
              "currency": "gbp",
              "interval": "day",
              "interval_count": 1,
              "livemode": false,
              "metadata": {},
              "meter": null,
              "nickname": null,
              "product": "prod_QEmxZbBxFnbtvH",
              "tiers_mode": null,
              "transform_usage": null,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "price": {
              "id": "price_1POJN8SGVFR9zdBLih02bpCw",
              "object": "price",
              "active": true,
              "billing_scheme": "per_unit",
              "created": 1717592122,
              "currency": "gbp",
              "custom_unit_amount": null,
              "livemode": false,
              "lookup_key": null,
              "metadata": {},
              "nickname": null,
              "product": "prod_QEmxZbBxFnbtvH",
              "recurring": {
                "aggregate_usage": null,
                "interval": "day",
                "interval_count": 1,
                "meter": null,
                "trial_period_days": null,
                "usage_type": "licensed"
              },
              "tax_behavior": "unspecified",
              "tiers_mode": null,
              "transform_quantity": null,
              "type": "recurring",
              "unit_amount": 1900,
              "unit_amount_decimal": "1900"
            },
            "quantity": 1,
            "subscription": "sub_1POI1uSGVFR9zdBLHo61MSKm",
            "tax_rates": []
          }
        ],
        "has_more": false,
        "total_count": 2,
        "url": "/v1/subscription_items?subscription=sub_1POI1uSGVFR9zdBLHo61MSKm"
      },
      "latest_invoice": "in_1POJfbSGVFR9zdBLNPUeRYP5",
      "livemode": false,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "on_behalf_of": null,
      "pause_collection": null,
      "payment_settings": {
        "payment_method_options": {
          "acss_debit": null,
          "bancontact": null,
          "card": {
            "network": null,
            "request_three_d_secure": "automatic"
          },
          "customer_balance": null,
          "konbini": null,
          "sepa_debit": null,
          "us_bank_account": null
        },
        "payment_method_types": null,
        "save_default_payment_method": "off"
      },
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": null,
      "quantity": null,
      "schedule": null,
      "start_date": 1717586962,
      "status": "active",
      "test_clock": null,
      "transfer_data": null,
      "trial_end": null,
      "trial_settings": {
        "end_behavior": {
          "missing_payment_method": "create_invoice"
        }
      },
      "trial_start": null
    }
  ],
  "has_more": false,
  "url": "/v1/subscriptions"
}

let activeSubscription = sub.data.filter(item => item.id === "sub_1POI1uSGVFR9zdBLHo61MSKm")[0];
console.log('activeSubscription is \n', activeSubscription);
activeSubscription = activeSubscription.items.data
console.log('activeSubscription is \n', activeSubscription)