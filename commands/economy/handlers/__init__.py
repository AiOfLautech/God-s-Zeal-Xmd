from handlers.economy import register_economy_handlers
from handlers.crime import register_crime_handlers
from handlers.gambling import register_gambling_handlers
from handlers.shopping import register_shopping_handlers
from handlers.vehicles import register_vehicle_handlers
from handlers.properties import register_property_handlers
from handlers.combat import register_combat_handlers
from handlers.gathering import register_gathering_handlers
from handlers.social import register_social_handlers
from handlers.misc import register_misc_handlers
from handlers.admin import register_admin_handlers
from handlers.transfers import register_transfer_handlers
from handlers.loans import register_loan_handlers
from handlers.extra_commands import register_extra_handlers
from handlers.callbacks import register_callback_handlers

def register_all_handlers(app):
    register_economy_handlers(app)
    register_crime_handlers(app)
    register_gambling_handlers(app)
    register_shopping_handlers(app)
    register_vehicle_handlers(app)
    register_property_handlers(app)
    register_combat_handlers(app)
    register_gathering_handlers(app)
    register_social_handlers(app)
    register_misc_handlers(app)
    register_admin_handlers(app)
    register_transfer_handlers(app)
    register_loan_handlers(app)
    register_extra_handlers(app)
    register_callback_handlers(app)
