# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

require 'csv'

csv_text = File.read('db/paths.csv')
csv = CSV.parse(csv_text, :headers => false)
csv.each do |row|
  Path.create!({
    :origin => row[0],
    :destination => row[1],
    :distance => row[2]
  })
end
