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
        # Setup pawn capture (White captures Black)
        self.board.grid[5][5] = "pn"
        self.assertTrue(self.board.move_piece((6, 4), (5, 5)))
        self.assertEqual(self.board.grid[5][5], "pb")
        self.assertEqual(self.board.grid[6][4], "")

    def test_en_passant(self):
        # Setup en passant (White captures Black)
        self.board.move_piece((6, 4), (4, 4)) # White e4
        self.board.move_piece((1, 3), (3, 3)) # Black d5
        self.board.move_piece((4, 4), (3, 4)) # White e5
        self.board.move_piece((1, 5), (3, 5)) # Black f5 (double move)
        
        # White can capture f5 en passant at (2, 5)
        self.assertEqual(self.board.turn, 'b')
        self.assertEqual(self.board.en_passant_target, (2, 5))
        self.assertTrue(self.board.move_piece((3, 4), (2, 5)))
        self.assertEqual(self.board.grid[3][5], "") # Black pawn removed
        self.assertEqual(self.board.grid[2][5], "pb")

    def test_promotion(self):
        # Setup promotion
        self.board.grid[1][0] = "pb"
        self.board.grid[0][0] = "" # Clear path
        self.board.turn = 'b'
        # Move white pawn to last rank
        self.assertTrue(self.board.move_piece((1, 0), (0, 0), promotion_choice='d'))
        self.assertEqual(self.board.grid[0][0], "db") # Promoted to queen

    def test_piece_blocking(self):
        # White bishop blocked by own pawn
        self.assertFalse(self.board.move_piece((7, 2), (5, 4)))
        # Move pawn out of the way
        self.board.move_piece((6, 3), (4, 3))
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
        self.board.grid[0][1] = ""   # Empty square
        self.board.turn = 'n'
        
        # Moving another piece (if any) shouldn't work if it doesn't block
        self.board.grid[2][2] = "pn"
        self.assertFalse(self.board.move_piece((2, 2), (3, 2)))
        
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
        # Clear board for clean test
        self.board.grid = [["" for _ in range(COLS)] for _ in range(ROWS)]
        self.board.grid[7][4] = "rb" # White King
        self.board.grid[7][0] = "tb" # White Rook
        
        # Attack the square (7, 3) with a black rook
        self.board.grid[0][3] = "tn"
        
        # White king at (7, 4) tries to castle queenside (moving to (7, 2) through (7, 3))
        self.assertFalse(self.board.check_castling((7, 4), (7, 2), 'b'))

    def test_bishop_move(self):
        # White bishop move
        self.board.grid[6][3] = "" # Clear pawn
        self.assertTrue(self.board.move_piece((7, 2), (5, 4)))
        self.assertEqual(self.board.grid[5][4], "fb")

    def test_rook_move(self):
        # White rook move
        self.board.grid[6][0] = "" # Clear pawn
        self.assertTrue(self.board.move_piece((7, 0), (5, 0)))
        self.assertEqual(self.board.grid[5][0], "tb")

    def test_queen_move(self):
        # White queen move
        # Clear the path
        self.board.grid[6][2] = ""
        self.board.grid[5][1] = ""
        self.board.grid[6][3] = ""
        self.assertTrue(self.board.move_piece((7, 3), (4, 0)))
        self.assertEqual(self.board.grid[4][0], "db")

    def test_king_move(self):
        # White king move
        self.board.grid[6][4] = "" # Clear pawn
        self.assertTrue(self.board.move_piece((7, 4), (6, 4)))
        self.assertEqual(self.board.grid[6][4], "rb")

    def test_castling_queenside(self):
        # Clear path for queenside castling
        self.board.grid[7][1] = ""
        self.board.grid[7][2] = ""
        self.board.grid[7][3] = ""
        # King move 2 squares
        self.assertTrue(self.board.move_piece((7, 4), (7, 2)))
        self.assertEqual(self.board.grid[7][2], "rb")
        self.assertEqual(self.board.grid[7][3], "tb") # Rook moved

    def test_en_passant_black(self):
        # Setup en passant for black (Black captures White)
        # 1. d4 (White)
        self.board.move_piece((6, 3), (4, 3))
        # 2. d5 (White)
        self.board.turn = 'b'
        self.board.move_piece((4, 3), (3, 3))
        # 3. e4 (Black)
        self.board.turn = 'n'
        self.board.move_piece((1, 4), (3, 4))
        
        # 4. White moves d2-d4 (double move)
        # Oh wait, if white is at (3, 3), that's the d-pawn.
        # Let's use another pawn for white. e-pawn?
        # Let's restart setup for simplicity.
        self.board = Board()
        # White e2-e4, Black e7-e5, White e4-e5, Black d7-d5
        # No, that's White captures Black.
        # We want Black captures White.
        # White d2-d4, Black d7-d5, White d4-d5, Black e7-e4 (wait black moves to row 4)
        # Let's do:
        # Black pawn reaches row 3 (from black's perspective, so row 4 in index)
        # White pawn double moves to row 4 next to black pawn.
        self.board.grid[4][4] = "pn" # Black pawn at e4
        self.board.turn = 'b'
        self.board.move_piece((6, 3), (4, 3)) # White moves d2-d4
        
        # Now black (4, 4) captures white (4, 3) en passant at (5, 3)
        self.assertEqual(self.board.turn, 'n')
        self.assertEqual(self.board.en_passant_target, (5, 3))
        self.assertTrue(self.board.move_piece((4, 4), (5, 3)))
        self.assertEqual(self.board.grid[4][3], "") # White pawn removed

    def test_move_invalid_start_empty(self):
        # Cannot move from an empty square
        self.assertFalse(self.board.move_piece((3, 0), (4, 0)))

    def test_move_invalid_target_own_piece(self):
        # Cannot capture own piece
        self.assertFalse(self.board.move_piece((7, 0), (6, 0)))

    def test_move_not_in_valid_moves(self):
        # Move that is not allowed by piece logic
        self.assertFalse(self.board.move_piece((7, 1), (4, 1)))

    def test_discovered_check(self):
        # White Bishop at (7, 2), White Rook at (7, 0), Black King at (0, 0)
        # Rook is blocked by Bishop. Move Bishop to reveal check.
        self.board.grid = [["" for _ in range(COLS)] for _ in range(ROWS)]
        self.board.grid[0][0] = "rn"
        self.board.grid[7][0] = "tb"
        self.board.grid[6][0] = "fb"
        self.board.turn = 'b'
        
        # Move bishop to reveal rook's attack
        self.assertTrue(self.board.move_piece((6, 0), (5, 1)))
        self.assertTrue(self.board.is_in_check('n'))

    def test_double_check(self):
        # White Rook at (7, 0), White Knight at (2, 1), Black King at (0, 0)
        self.board.grid = [["" for _ in range(COLS)] for _ in range(ROWS)]
        self.board.grid[0][0] = "rn"
        self.board.grid[7][0] = "tb" # Attacks column 0
        self.board.grid[2][1] = "cb" # Can attack (0, 0) via (1, 2) or (2, 1) to (0, 0) wait...
        # Knight at (2, 1) attacks (0, 0) and (0, 2)
        self.board.turn = 'b'
        self.assertTrue(self.board.is_in_check('n'))
        
        # Check if both can attack
        self.assertTrue(self.board.can_attack((7, 0), (0, 0)))
        self.assertTrue(self.board.can_attack((2, 1), (0, 0)))

    def test_promotion_capture(self):
        # White pawn at (1, 1), Black piece at (0, 0)
        self.board.grid = [["" for _ in range(COLS)] for _ in range(ROWS)]
        self.board.grid[1][1] = "pb"
        self.board.grid[0][0] = "tn"
        self.board.turn = 'b'
        # Capture and promote
        self.assertTrue(self.board.move_piece((1, 1), (0, 0), promotion_choice='d'))
        self.assertEqual(self.board.grid[0][0], "db")

    def test_pawn_blocked_exhaustive(self):
        # 1. Blocked forward
        self.board.grid = [["" for _ in range(COLS)] for _ in range(ROWS)]
        self.board.grid[6][4] = "pb"
        self.board.grid[5][4] = "pn"
        self.assertFalse(self.board.move_piece((6, 4), (5, 4)))
        
        # 2. Blocked capture (no piece)
        self.assertFalse(self.board.move_piece((6, 4), (5, 5)))

    def test_threefold_repetition_with_rights(self):
        """Test that same position with different castling rights is NOT a repetition."""
        self.board = Board()
        sig_initial = self.board.get_position_signature()
        
        # 1. White moves King g1-f1 then back (loses castling rights)
        # Wait, King is at e1 (7, 4). Move to f1 (7, 5).
        # Need to clear f1.
        self.board.grid[7][5] = ""
        self.board.move_piece((7, 4), (7, 5)) # Turn: Black
        self.board.move_piece((0, 1), (2, 2)) # Black random move
        self.board.move_piece((7, 5), (7, 4)) # Turn: Black
        
        # Board looks the same but White lost castling rights
        sig_after = self.board.get_position_signature()
        self.assertNotEqual(sig_initial, sig_after)

    def test_piece_blocking_exhaustive(self):
        # 1. Rook blocked by ally
        self.board.grid = [["" for _ in range(COLS)] for _ in range(ROWS)]
        self.board.grid[7][0] = "tb"
        self.board.grid[5][0] = "pb"
        self.assertFalse(self.board.move_piece((7, 0), (4, 0)))
        
        # 2. Bishop blocked by ally
        self.board.grid[7][2] = "fb"
        self.board.grid[6][3] = "pb"
        self.assertFalse(self.board.move_piece((7, 2), (5, 4)))

if __name__ == '__main__':
    unittest.main()
