class CreatePaths < ActiveRecord::Migration
  def change
    create_table :paths do |t|
      t.string :origin
      t.string :destination
      t.integer :distance
    end
  end
end
