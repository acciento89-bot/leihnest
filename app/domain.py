"""Public service facade. All permission checks live below the HTTP layer."""
from pathlib import Path
from app.db import Database, BaseService, DomainError
from app.accounts import Accounts
from app.groups import Groups
from app.inventory import Inventory
from app.loans import Loans

class Store(Accounts, Groups, Inventory, Loans, BaseService):
    def __init__(self, path: Path):
        self.db = Database(path)

__all__ = ['Store', 'DomainError']
