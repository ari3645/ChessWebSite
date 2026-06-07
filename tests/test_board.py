import unittest
from src.board import Board
from src.constants import ROWS, COLS

class TestBoard(unittest.TestCase):
    def setUp(self):
        self.board = Board()

    def test_initial_setup(self):
        # Test initial pieces positions
        self.assertEqual(self.board.grid[0][0], "tn")
        self.assertEqual(self.board.grid[7][4], "rb")
        self.assertEqual(self.board.turn, 'b')

    def test_pawn_move(self):
        # White pawn move from start
        self.assertTrue(self.board.move_piece((6, 4), (4, 4)))
        self.assertEqual(self.board.grid[4][4], "pb")
        self.assertEqual(self.board.grid[6][4], "")
        self.assertEqual(self.board.turn, 'n')

    def test_invalid_turn(self):
        # Black should not be able to move white piece
        self.board.turn = 'n'
        self.assertFalse(self.board.move_piece((6, 0), (5, 0)))

    def test_pawn_capture(self):
        # Setup pawn capture
        self.board.grid[5][5] = "pn"
        self.assertTrue(self.board.move_piece((6, 4), (5, 5)))
        self.assertEqual(self.board.grid[5][5], "pb")
        self.assertEqual(self.board.grid[6][4], "")

    def test_en_passant(self):
        # Setup en passant
        self.board.move_piece((6, 4), (4, 4)) # White e4
        self.board.move_piece((1, 3), (3, 3)) # Black d5
        self.board.move_piece((4, 4), (3, 4)) # White e5
        self.board.move_piece((1, 5), (3, 5)) # Black f5 (double move)
        
        # White can capture f5 en passant at (2, 5)
        self.assertEqual(self.board.en_passant_target, (2, 5))
        self.assertTrue(self.board.move_piece((3, 4), (2, 5)))
        self.assertEqual(self.board.grid[3][5], "") # Black pawn removed
        self.assertEqual(self.board.grid[2][5], "pb")

    def test_promotion(self):
        # Setup promotion
        self.board.grid[1][0] = "pb"
        self.board.turn = 'b'
        # Move white pawn to last rank
        self.assertTrue(self.board.move_piece((1, 0), (0, 0), promotion_choice='d'))
        self.assertEqual(self.board.grid[0][0], "db") # Promoted to queen

    def test_piece_blocking(self):
        # White bishop blocked by own pawn
        self.assertFalse(self.board.move_piece((7, 2), (5, 4)))
        # Move pawn out of the way
        self.board.move_piece((6, 3), (5, 3))
        self.board.turn = 'b' # Force back to white
        self.assertTrue(self.board.move_piece((7, 2), (5, 4)))

    def test_knight_jump(self):
        # Knight can jump over pieces
        self.assertTrue(self.board.move_piece((7, 1), (5, 2)))
        self.assertEqual(self.board.grid[5][2], "cb")

    def test_leaves_king_in_check(self):
        # King in check, must move or block
        self.board.grid = [["" for _ in range(COLS)] for _ in range(ROWS)]
        self.board.grid[0][0] = "rn" # Black King
        self.board.grid[7][0] = "tb" # White Rook
        self.board.grid[0][1] = "pn" # Black Pawn next to king
        self.board.turn = 'n'
        
        # Moving the pawn doesn't help with the check from the rook
        self.assertFalse(self.board.move_piece((0, 1), (1, 1)))
        
        # Moving the king out of check should work
        self.assertTrue(self.board.move_piece((0, 0), (0, 1)))

    def test_stalemate(self):
        """Setup a position where it's a stalemate for the black king."""
        self.board.grid = [["" for _ in range(COLS)] for _ in range(ROWS)]
        self.board.grid[0][0] = "rn" # Black King at a8
        self.board.grid[1][2] = "db" # White Queen at c7
        self.board.grid[2][1] = "rb" # White King at b6
        self.board.turn = 'n'
        self.assertTrue(self.board.is_stalemate('n'))
        self.assertFalse(self.board.is_in_check('n'))

    def test_threefold_repetition(self):
        """Perform moves that lead to the same position 3 times and check is_threefold_repetition()."""
        # Knight moves to repeat positions (White Knight g1-f3-g1, Black Knight g8-f6-g8)
        moves = [
            ((7, 6), (5, 5)), ((0, 6), (2, 5)), # Knights move out
            ((5, 5), (7, 6)), ((2, 5), (0, 6))  # Knights move back
        ]
        # Repeat the sequence 3 times
        for _ in range(3):
            for start, end in moves:
                self.board.move_piece(start, end)
        
        self.assertTrue(self.board.is_threefold_repetition())

    def test_insufficient_material(self):
        """Test various scenarios (King vs King, King+Knight vs King, King+Bishop vs King)."""
        # 1. King vs King
        self.board.grid = [["" for _ in range(COLS)] for _ in range(ROWS)]
        self.board.grid[0][0] = "rn"
        self.board.grid[7][7] = "rb"
        self.assertTrue(self.board.is_insufficient_material())
        
        # 2. King + Knight vs King
        self.board.grid[0][1] = "cb"
        self.assertTrue(self.board.is_insufficient_material())
        
        # 3. King + Bishop vs King
        self.board.grid[0][1] = "fb"
        self.assertTrue(self.board.is_insufficient_material())
        
        # 4. King + Queen vs King (Should NOT be insufficient)
        self.board.grid[0][1] = "db"
        self.assertFalse(self.board.is_insufficient_material())

    def test_fifty_move_rule(self):
        """Simulate 100 half-moves without capture or pawn move."""
        self.board.half_move_clock = 99
        self.assertFalse(self.board.is_fifty_move_rule())
        
        # Perform a knight move (increments clock)
        self.board.move_piece((7, 1), (5, 2))
        self.assertTrue(self.board.is_fifty_move_rule())
        
        # Perform a pawn move (resets clock)
        self.board.turn = 'n'
        self.board.move_piece((1, 0), (2, 0))
        self.assertEqual(self.board.half_move_clock, 0)
        self.assertFalse(self.board.is_fifty_move_rule())

    def test_castling_restrictions(self):
        """Test that castling is blocked if the king or rook has moved, or if pieces are in between."""
        # Setup: Clear path for white kingside castling
        self.board.grid[7][5] = ""
        self.board.grid[7][6] = ""
        
        # 1. Test initially allowed (assuming no previous moves)
        self.assertTrue(self.board.check_castling((7, 4), (7, 6), 'b'))
        
        # 2. Test blocked by piece (put a Bishop in between)
        self.board.grid[7][5] = "fb"
        self.assertFalse(self.board.check_castling((7, 4), (7, 6), 'b'))
        self.board.grid[7][5] = "" # Clear again
        
        # 3. Test king has moved
        self.board.moved_status[(7, 4)] = True
        self.assertFalse(self.board.check_castling((7, 4), (7, 6), 'b'))
        self.board.moved_status[(7, 4)] = False # Reset
        
        # 4. Test rook has moved
        self.board.moved_status[(7, 7)] = True
        self.assertFalse(self.board.check_castling((7, 4), (7, 6), 'b'))
        self.board.moved_status[(7, 7)] = False # Reset
        
        # 5. Test queenside blocked by pieces (Knight still at b1)
        self.assertFalse(self.board.check_castling((7, 4), (7, 2), 'b'))

    def test_castling_through_check(self):
        """Test that castling is blocked if the king passes through a square under attack."""
        # Setup: Clear path for white queenside castling
        self.board.grid[7][1] = ""
        self.board.grid[7][2] = ""
        self.board.grid[7][3] = ""
        
        # Attack the square (7, 3) with a black rook
        self.board.grid[0][3] = "tn"
        
        # White king at (7, 4) tries to castle queenside (moving to (7, 2) through (7, 3))
        self.assertFalse(self.board.check_castling((7, 4), (7, 2), 'b'))

if __name__ == '__main__':
    unittest.main()
